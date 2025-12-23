pipeline {
    agent any

    environment {
        APP_NAME        = "nextme-frontend"
        NAMESPACE       = "next-me"
        REGISTRY        = "ghcr.io"
        GH_OWNER        = "sparta-next-me"
        IMAGE_REPO      = "nextme-frontend"
        FULL_IMAGE      = "${REGISTRY}/${GH_OWNER}/${IMAGE_REPO}:latest"
        TZ              = "Asia/Seoul"
        // 빌드 시점에 API 주소를 주입하기 위한 변수
        NEXT_PUBLIC_API_URL = "http://34.50.7.8:30000"
    }

    stages {
        stage('Checkout') {
            steps {
                // 깃허브에서 프론트엔드 소스 코드 가져오기ㅇㅇ
                checkout scm
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'ghcr-credential', usernameVariable: 'USER', passwordVariable: 'TOKEN')]) {
                    sh """
                      # Docker 빌드 시 --build-arg를 사용하여 환경 변수를 주입할 수 있습니다.
                      # (Dockerfile 내부에 ARG NEXT_PUBLIC_API_URL 설정이 있을 경우)
                      docker build --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} -t ${FULL_IMAGE} .

                      echo "${TOKEN}" | docker login ${REGISTRY} -u "${USER}" --password-stdin
                      docker push ${FULL_IMAGE}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE')
                ]) {
                    sh '''
                      export KUBECONFIG=${KUBECONFIG_FILE}

                      echo "Applying manifests from frontend-service.yaml..."
                      # 아까 작성한 프론트엔드용 yaml 파일 이름을 넣으세요
                      kubectl apply -f frontend-service.yaml -n ${NAMESPACE}

                      echo "Monitoring rollout status..."
                      kubectl rollout status deployment/nextme-frontend -n ${NAMESPACE}
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up Docker resources..."
            sh "docker rmi ${FULL_IMAGE} || true"
            sh "docker system prune -f"
        }
        success {
            echo "Successfully deployed ${APP_NAME}!"
        }
        failure {
            echo "Deployment failed."
        }
    }
}