pipeline {
    agent {label 'Linux' }
    tools {
        nodejs 'NodeJs 14.17.5'
    }
    environment {
        NEXUS_SERVER_URL = "10.0.2.15:8082"
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
        
        stage ('Quality Gate') { 
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
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
        //CI Pipeline Finish
        //CD Pipeline Start
        stage ('Deploy to Staging') {
            environment{
                TAG = "$IMAGE_TAG_STG"
                SERVICE_NAME = "$IMAGE_NAME"
                SERVICES_QUANTITY = "3"
            }
            steps {
                sh "docker-compose up -d --scale $SERVICE_NAME=$SERVICES_QUANTITY --force-recreate"
                sleep 15
            }
        }

        stage ('Acceptance Tests') {
            environment {
                API_URL = "http://10.0.2.15"
                PORT_1 = "3000"
                PORT_2 = "3001"
                PORT_3 = "3002"
                END_P1 = "scenario"
                END_P2 = "action"
                END_P3 = "actor"
                SC_ID = "3M0DcVmST46NXClnRAYY"
            }
            steps {
                sh "curl -I $API_URL:$PORT_1/$END_P1/$SC_ID --silent | grep 200"  
                sh "curl --location --request PUT $API_URL:$PORT_2/$END_P2 --header 'Content-Type: application/json' --data-raw '{ \"scenario\" : \"gDEM9vj1OjncayQHE8GI\", \"actor\" : \"Polo\", \"action\" : \"Shoot Weapon\", \"target\" : \"east\", \"scenes\" : \"4\" }' | grep 200"
                sh "curl --location --request PUT $API_URL:$PORT_3/$END_P3 --header 'Content-Type: application/json' --data-raw '{ \"scenario\" : \"gDEM9vj1OjncayQHE8GI\", \"name\" : \"Ryan\", \"type\" : \"PF Squad Soldier\", \"health\" : 1, \"weapon\" : { \"name\" : \"rifle\", \"power\" : 1, \"xScope\" : 1, \"yScope\" : 1 }, \"position\" : { \"xPos\" : 8, \"yPos\" : 1 } }' | grep 200"
            }
        }

        stage ('Tag Production Image') {
            when { branch 'main' }
            environment { TAG = "$IMAGE_TAG_PROD" }
            steps {
                sh "docker tag $FULL_IMAGE_NAME:$IMAGE_TAG_STG $FULL_IMAGE_NAME:$IMAGE_TAG_PROD"
                sh "docker tag $FULL_IMAGE_NAME:$IMAGE_TAG_STG $FULL_IMAGE_NAME:latest"
            }
        }

        stage('Deliver Image for Production') {
            when { branch 'main' }
            environment{ 
                NEXUS_CREDENTIALS = credentials("nexus")
            }
            steps {
                sh """
                echo 'Log into Docker Hub'
                echo '$DOCKER_HUB_CREDENTIALS_PSW' | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin
                echo 'Push image to Docker Hub'
                docker push $FULL_IMAGE_NAME:$IMAGE_TAG_PROD
                docker push $FULL_IMAGE_NAME:latest
                """
            }
            post {
                always {
                    script {
                        sh """
                        echo "Removing Image built for Docker Hub"
                        docker rmi -f $FULL_IMAGE_NAME:$IMAGE_TAG_PROD
                        docker rmi -f $FULL_IMAGE_NAME:latest
                        echo 'Logout Docker Hub'
                        docker logout
                        """
                    }
                }
            }
        }
    // End Continuous Delivery Pipeline

    // Continuos Deployment Pipeline
        stage ('Continuous Deployment') {
            when { branch 'main' }
            environment {
                PROD_SERVER = "ubuntu@ec2-18-207-228-156.compute-1.amazonaws.com"
                FOLDER_NAME = $IMAGE_NAME
                SCRIPT = "deployment.sh"
                COMPOSE_FILE = "prod.docker-compose.yaml"
                ENV_FILE = ".env"
            }
            stages {
                stage ('Create .env file') {
                    when { branch 'main' }
                    environment{ TAG = "latest" }
                    steps {
                        sh """
                        echo 'FULL_IMAGE_NAME=$FULL_IMAGE_NAME' > $ENV_FILE
                        echo 'TAG=$TAG' >> $ENV_FILE
                        """
                    }
                }

                stage ('Copy files to Prod Server') {
                    when { branch 'main' }
                    steps {
                        sshagent(['prod-key']) {
                            sh "ssh -o 'StrictHostKeyChecking no' $PROD_SERVER mkdir -p $FOLDER_NAME"
                            sh "scp $ENV_FILE $SCRIPT $COMPOSE_FILE $PROD_SERVER:/home/ubuntu/$FOLDER_NAME"
                            sh "ssh -o 'StrictHostKeyChecking no' $PROD_SERVER ls -a /home/ubuntu/$FOLDER_NAME"
                        }
                    }
                }

                stage ('Deploy in Production') {
                    when { branch 'main' }
                    steps {
                        sshagent(['prod-key']) {
                            sh "ssh -o 'StrictHostKeyChecking no' $PROD_SERVER chmod +x /home/ubuntu/$FOLDER_NAME/$SCRIPT"
                            sh "ssh -o 'StrictHostKeyChecking no' $PROD_SERVER /home/ubuntu/$FOLDER_NAME/$SCRIPT"
                        }
                    }
                }
            }
        }
    }
}
