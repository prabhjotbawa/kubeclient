import { getKubeConfig } from '../src/KubernetesClient';
import * as k8s from '@kubernetes/client-node';

const kc = getKubeConfig();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

describe('Kubernetes API Integration Tests', () => {
    let testPodName;
    
    // Setup before all tests
    beforeAll(async () => {
      testPodName = `test-pod-${Math.random().toString(36).substring(7)}`;
    });
  
    describe('Pod Operations', () => {
      const namespace = 'default';
      it('should create and delete a pod', async () => {
        const podManifest = {
          metadata: {
            name: testPodName,
            namespace: namespace
          },
          spec: {
            containers: [{
              name: 'nginx',
              image: 'nginx:latest'
            }]
          }
        };

        const ns = ((await k8sApi.listNamespace()).items).map(ns => ns.metadata.name);
        console.log(ns);

        const pods = (await k8sApi.listPodForAllNamespaces()).items.map(pod => pod.metadata.name);
        console.log(pods);
  
        // Create pod
        const createResponse = await k8sApi.createNamespacedPod({namespace: namespace, body: podManifest});
        expect(createResponse.metadata.name).toBe(testPodName);
  
        // Wait for pod to be ready
        await waitForPodReady(testPodName, namespace);
  
        // Verify pod exists
        const readResponse = await k8sApi.readNamespacedPod({name: testPodName, namespace: namespace});
        expect(readResponse.metadata.name).toBe(testPodName);
  
        // Clean up - delete pod
        await k8sApi.deleteNamespacedPod({name: testPodName, namespace: namespace});
      }, 30000); // Longer timeout for pod creation/deletion
  
    });
  
    // Helper function to wait for pod to be ready
    async function waitForPodReady(podName, namespace, timeout = 20000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const response = await k8sApi.readNamespacedPod({name: podName, namespace: namespace});
          const podPhase = response.status.phase;
          
          if (podPhase === 'Running') {
            return true;
          }
          
          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          if (err.statusCode === 404) {
            // Pod not found yet, continue waiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw err;
          }
        }
      }
      
      throw new Error(`Pod ${podName} did not become ready within ${timeout}ms`);
    }
  });