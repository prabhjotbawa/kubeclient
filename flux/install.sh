cd flux

kubectl apply -f serviceaccount.yaml
kubectl apply -f role.yaml
kubectl apply -f rolebinding.yaml
kubectl apply -f helmrelease.yaml
# Wait for helm release to be ready
kubectl wait --for=condition=ready helmrelease/sample-app -n default
kubectl apply -f post-deploy.yaml