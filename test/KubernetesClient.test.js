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
        const createResponse = await k8sApi.createNamespacedPod(podManifest);
        expect(createResponse.body.metadata.name).toBe(testPodName);
  
        // Wait for pod to be ready
        await waitForPodReady(testPodName);
  
        // Verify pod exists
        const readResponse = await k8sApi.readNamespacedPod(testPodName, namespace);
        expect(readResponse.body.metadata.name).toBe(testPodName);
  
        // Clean up - delete pod
        await k8sApi.deleteNamespacedPod(testPodName, namespace);
      }, 30000); // Longer timeout for pod creation/deletion
  
      it('should handle API errors appropriately', async () => {
        await expect(
          k8sApi.readNamespacedPod('non-existent-pod', 'default')
        ).rejects.toThrow(/not found/);
      });
    });
  
    // describe('Watch Operations', () => {
    //   it('should watch pod events', async () => {
    //     // Create a promise that resolves when we receive a pod event
    //     const watchPromise = new Promise((resolve) => {
    //       const watch = new k8s.Watch(getKubeConfig());
          
    //       watch.watch('/api/v1/namespaces/default/pods',
    //         {},
    //         (type, apiObj) => {
    //           console.log(`Received pod event: ${type}`);
    //           watch.abort(); // Stop watching after first event
    //           resolve({ type, apiObj });
    //         },
    //         (err) => {
    //           if (err) {
    //             console.error(`Watch error: ${err}`);
    //           }
    //         }
    //       );
    //     });
  
    //     // Create a pod to trigger an event
    //     const podManifest = {
    //       metadata: {
    //         name: `watch-test-pod-${Math.random().toString(36).substring(7)}`
    //       },
    //       spec: {
    //         containers: [{
    //           name: 'nginx',
    //           image: 'nginx:latest'
    //         }]
    //       }
    //     };
  
    //     await k8sApi.createNamespacedPod('default', podManifest);
        
    //     // Wait for watch event
    //     const event = await watchPromise;
    //     expect(event.type).toBeDefined();
    //     expect(event.apiObj).toBeDefined();
  
    //     // Clean up
    //     await k8sApi.deleteNamespacedPod(podManifest.metadata.name, 'default');
    //   }, 30000);
    // });
  
    // Helper function to wait for pod to be ready
    async function waitForPodReady(podName, timeout = 20000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const response = await k8sApi.readNamespacedPod(podName, 'default');
          const podPhase = response.body.status.phase;
          
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