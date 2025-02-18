import { KubeConfig } from '@kubernetes/client-node';
import path from 'path';
import { existsSync } from 'fs';

// Helper function to determine if we're running in-cluster
function isRunningInCluster() {
  return existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
}

// Helper function to get KubeConfig based on environment
export function getKubeConfig() {
  const kc = new KubeConfig();
  
  if (isRunningInCluster()) {
    // Load in-cluster config when running in a pod
    kc.loadFromCluster();
  } else {
    // Load from default location (~/.kube/config) when running locally
    kc.loadFromDefault();
  }
  
  return kc;
}