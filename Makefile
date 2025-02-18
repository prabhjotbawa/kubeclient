.PHONY: build test

build:
	npm install

test:
	npx jest

k8s-setup:
	minikube start --memory 6144 --cpus 2
	kubectl config use-context minikube