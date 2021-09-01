pipeline {
    agent {label 'Linux' }
    tools {
        nodejs 'NodeJs 14.17.5'
    }
    environment {
        NEXUS_SERVER_URL = "172.29.162.106:8082"
        DOCKER_HUB_CREDENTIALS = credentials("dockerhub")
        DOCKER_HUB_REPO = "zkpain"
        IMAGE_NAME = "msmapi_stg"
        IMAGE_TAG_STG = "$BUILD_NUMBER-stg"
        IMAGE_TAG_PROD = "$BUILD_NUMBER-prod"
        FULL_IMAGE_NAME = "$DOCKER_HUB_REPO/$IMAGE_NAME"
        PROJECT_NAME = "msm_prjct"
        PRIVATE_IMAGE_NAME = "$NEXUS_SERVER_URL/$IMAGE_NAME"
    }
    stages {
        stage('Install') {
            steps {
                sh "npm install"
            }
        }
        stage('Unit tests & Coverage') {
            steps {
                sh "npm test"
            }
        }
        stage('Eslint validations') {
            steps {
                sh "npm run lint"
            }
        }

         stage ('sonarqube Analysis') {
            environment {
                COVERAGE_PATH = "coverage/lcov.info"
            }
            steps {
                script {
                    def scannerHome = tool 'sonarscanner4.6.2'
                    def scannerParameters = "-Dsonar.projectName=$PROJECT_NAME " + 
                        "-Dsonar.projectKey=$PROJECT_NAME -Dsonar.sources=. " + 
                        "-Dsonar.javascript.lcov.reportPaths=$COVERAGE_PATH"
                    withSonarQubeEnv('sonarqube') {
                        sh "${scannerHome}/bin/sonar-scanner ${scannerParameters}"
                    }
                }
            }
        }

        stage('Build Image') {
            when { 
                branch 'main' 
            }
            environment{ 
                TAG = "$IMAGE_TAG_STG"
            }
            steps {
                //sh "docker-compose build $IMAGE_NAME"
                sh "docker build -t $PRIVATE_IMAGE_NAME:$TAG ."
            }
            post { 
                failure{
                    script {
                        sh "docker rmi \$(docker images --filter dangling=true -q)"
                    }
                }
            }
        }
        stage('Publish Image') {
            when { branch 'main' }
            environment{ 
                TAG = "$IMAGE_TAG_STG" 
                NEXUS_CREDENTIALS = credentials("nexus")
                }
            steps {
               // sh "echo '$DOCKER_HUB_CREDENTIALS_PSW' | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin"
               // sh "docker-compose push $IMAGE_NAME"
                sh "echo '$NEXUS_CREDENTIALS_PSW' | docker login -u $NEXUS_CREDENTIALS_USR --password-stdin $NEXUS_SERVER_URL"
                sh "docker push $PRIVATE_IMAGE_NAME:$TAG"
            }
            post {
                always {
                    script {
                        //sh "docker rmi -f $IMAGE_NAME:$TAG"
                        //sh "docker logout"
                        sh "docker rmi -f $PRIVATE_IMAGE_NAME:$TAG"
                        sh "docker logout $NEXUS_SERVER_URL"
                    }
                }
            }
        }
    }
}
