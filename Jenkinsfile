pipeline {
    agent {label 'Linux' }
    tools {
        nodejs 'NodeJs 14.17.5'
    }
    environment {
        DOCKER_HUB_CREDENTIALS = credentials("dockerhub")
        DOCKER_HUB_REPO = "zkpain"
        IMAGE_NAME = "msmapi_stg"
        IMAGE_TAG_STG = "$BUILD_NUMBER-stg"
        IMAGE_TAG_PROD = "$BUILD_NUMBER-prod"
        FULL_IMAGE_NAME = "$DOCKER_HUB_REPO/$IMAGE_NAME"
        PROJECT_NAME = "msm_prjct"
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
                sh "npm jest --coverage"
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
                sh "docker-compose build $IMAGE_NAME"
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
            environment{ TAG = "$IMAGE_TAG_STG" }
            steps {
                sh "echo '$DOCKER_HUB_CREDENTIALS_PSW' | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin"
                sh "docker-compose push $IMAGE_NAME"
            }
            post {
                always {
                    script {
                        sh "docker rmi -f $IMAGE_NAME:$TAG"
                        sh "docker logout"
                    }
                }
            }
        }
    }
}
