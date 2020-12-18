# Boilerplate Template

Use this template to quickly get your React based frontend working with a graphql backend and lti compatible.

## To use: 

### Prerequisites
You will need to have git, npm and amplify installed as well on your machine.
   1. install git:  https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
   2. Install npm;
   3. Install amplify: npm install -g @aws-amplify/cli
   4. You will need an ASU AWS User account with sufficient permissions.


### Overview of what you will be doing.
1. Create new repository by using template functionality , give the new repo a new descriptive of purpose <APP_REPO_NAME>
2. Pull repo into your local machine
3. Create a new amplify user in AWS ASU account
4. Run ```amplify init```
5. Run ```amplify add api```  Sets up your AWS Database/Graphql service
6. Run ```amplify push```
7. Run a local test
8. Run ```amplify add hosting```
9. Run ```amplify publish```

10. Configure LMS (instructions will be for Canvas but you can use any LTI 1.3 compatible LMS)
11. Configure Boiler. You will be adding an additional consumer to the consumertools


#### 1. Create New Application from this repository
```
On GitHub, find this repository, 
navigate to the main page of the repository.
Above the file list, click -> Use this template 
Follow the steps to create a new repo with your application name <APP_REPO_NAME>
```
#### 2. Pull repo into your local machine
```
Go to your new repository <APP_REPO_NAME> 
click on Code dropdown, 
select preferred method (ssh or https), copy script.
Navigate to the folder that will house the new repo.
In your local machine 

git clone <COPIED SCRIPT>
you will probably want to work on a dev or similar branch...
git checkout -b dev
git push
 ```

#### 3. Create a new amplify user role/account
1. Assuming you have access to the ASU AWS account, log in and go here:a.https://console.aws.amazon.com/iam/home?region=us-west-2#/users
2. Click -> Add user
  * Create a name like <APP_REPO_NAME> -user. 
  * Select access type: Programmatic access
3. Click -> Next:Permissionsa.Select copy permissions from existing userb.select asu-etx-amplify-user
4. Click -> Next:Tags
5. Click -> Next:Review
6. Click -> Create User
   a. Do NOT CLOSE THIS WINDOW
   b. Once you close it, you will never be shown the access key ID and Secret access key again. You need to copy those or just keep this window open until you finish the next step

#### 4.  Run ```amplify init```
(you will most likely be able to use the default values, until you get to AWS profile)
```
? Enter a name for the project  (suggested name will be fine)
? Enter a name for the environment (default is fine, or name of branch, needs to be short no special characters, spaces  example: dev)
? Choose your default editor:  (we recommend Visual Studio Code)
? Choose the type of app that you're building  (javascript)
? What javascript framework are you using  (react)
? Source Directory Path:  (src)
? Distribution Directory Path: (build) 
? Build Command:  (npm run-script build) 
? Start Command: (npm run-script start) 

If you have AWS profile already, you may see this question:
Do you want to use an AWS profile? n 
enter the keyId you saved from step 4
enter the secret you saved from step 4
```
#### 5.  Run ```amplify add api```
```
? Please select from one of the below mentioned services: GraphQL
? Provide API name: <YOUR_APP_NAME>
? Choose the default authorization type for the API API key
? Enter a description for the API key: <YOUR_APP_NAME_API>
? After how many days from now the API key should expire (1-365): 7
? Do you want to configure advanced settings for the GraphQL API No, I am done.
? Do you have an annotated GraphQL schema? (y/N) y
? Provide your schema file path: ./schema/schema.graphql
```

> Please NOTE!
> This is the point where you would normally make changes in your schema.graphql
> file before pushing those changes to the AWS backend. **HOWEVER**, there are 2 things
> to be aware of. 1) We aren't doing that now because we want to test initial app functionality
> before making your custom changes. And 2) _**VERY IMPORTANT:**_ the schema.graphql file in your
> project's root/schema/ dir must be copied to the root/amplify/backend/api/**your-api-name**/schema.graphql
> file **BEFORE** you run ```amplify push```. AWS only looks at this backend schema.graphql file.
> The schema.graphql file in your schema directory is not touched by the code and has no effect
> on the application (it only serves as a backup file)


#### 6.  Run ```amplify push --y``` (Using --y skips the need for answering these questions) 
```
? Do you want to generate code for your newly created GraphQL API Yes
? Choose the code generation language target javascript
? Enter the file name pattern of graphql queries, mutations and subscriptions src/graphql/**/*.js
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2
⠸ Updating resources in the cloud. This may take a few minutes...
```

#### 6a. Ensure backend build is properly set up in console.
Go to Amplify Console for your app
On the left navigation panel, select ```build settings```
You should see the first 7 lines of the build script look like this:
```
version: 1
backend:
  phases:
    build:
      commands:
        - '# Execute Amplify CLI with the helper script'
        - amplifyPush --simple
```
If not, add what is shown above to the start of the build script.
(version: 1 is only in the script on the first line)


#### 7.  Run ```npm install``` and ```yarn start``` for a local test
```
npm install
```
Do NOT use yarn for installing. The build is set to use npm and a yarn-lock file will potentially break it.
(If you have accidentally used yarn install or yarn add, you will need to delete the yarn-lock, package-lock.json, node_modules dir, 
do an npm cache clean, yarn cache clean, and then reinstall everything with npm install.)

You are now ready to test locally.
Change the isDevMode value to ```true``` in the index.js file
```
yarn start
```
From here, you should now be able to see your browser window open as it fires up the local app.
This might take a minute or two to launch the first time.
Remeber you will need to change the URL to include parameters. Use something like this for your local testing:

```http://localhost:3000/assignment?userId=01&courseId=course-005&role=instructor```

If that worked, you’re almost ready to move on. But first:
add ```package-lock.json``` file to git tracking along with the newly generated graphql code files.
Commit and push these changes to your dev branch.
NOTE: You might get complaints about the schema.graphql file about unrecognized directives, etc. Ignore these “errors.” They are not errors, they are fine.

#### 8. Run ```amplify add hosting```
```
? Select the plugin module to execute (Use arrow keys)
select -❯ Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment) 
? Choose a type 
select -❯ Continuous deployment (Git-based deployments)

You will be taken to the relevant AWS Amplify project in AWS Console.
Click -> Frontend Environments
Select ->  GitHub
Click -> Connect Branch 
Find your repo and branch you are working on (dev) 
Select Backend environment (dev)
Select and accept all defaults (Next button, Next again, Save and Deploy)
When you are back to the frontend page: Note/Copy the url you see just below the image it will look something like this: https://dev.d2viqpegtzzo7m.amplifyapp.com
You will need this for the configuration later
```
#### 9. Run ```amplify publish``` (creating the auto build in AWS Console obviates the need for running this step)

#### 10. Configure LMS:
```
You will need administrative privileges.
1. Go to Admin
2. Click -> Developer Keys
3. Click -> + Developer Key
Enter the following:

Key Name: Application Name or Abbreviated value
Owner Email: your email
Redirect URIs:
   https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/lti-advantage-launch
   https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/assignment
   https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/deeplink

Method: Manual Entry
Title: What you want teachers to see for your application. 
Description: What you want the teachers to see to explain your applications functionality
Target Link URI: https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/lti-advantage-launch
OpenID Connect Initiation Url: https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/init-oidc
JWK Method: Public JWK URL
Public JWK URL: https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/jwks

LTI Advantage Services:
Select:
   Can create and view assignment data in the gradebook associated with the tool.
   Can view assignment data in the gradebook associated with the tool.
   Can view submission data for assignments associated with the tool.
   Can create and update submission results for assignments associated with the tool.
   Can retrieve user data associated with the context the tool is installed in.

Additional Settings:
Set to PUBLIC if you want your application to have Names and emails of students and faculty

Placements:
Remove any already in by default
Add: Assignment Selection

Assignment Selection:
Target Link URI: https://1cxw5vr28f.execute-api.us-west-2.amazonaws.com/stage/deeplink
Select Message Type: LtiDeepLinkingRequest

Save your data

Once back in Developer Keys list:
Under Details for your application: Copy number just above the Show Key button this is your Client ID

Click -> Settings (lower left an admin navigation)

Click -> Apps
Click -> View App Configurations
Click -> + App
Select COnfiguration Type -> By Client ID
Enter Your CLient ID
Click -> Submit
Accept all additional Modals.
Once you have returned to External Apps Find Your app
Right click on the settings Icon.
Select Deployment Id:  Save this id AND the Client ID for use when configuring Boiler app.
```

#### 11. Configure Boiler
1. Go back to git hub repo. Find the boiler app. (https://github.com/ETX-ASU/boiler)
2. Clone it.
3. Checkout stage branch
4. navigate to ltilambda src file 
   (./amplify/backend/function/ltilambda/src)
5. yarn run setup-tool-keys --name=<NAME_OF_YOUR_APP_SIMPLIFIED>
6. navigate to ./environments/stage/.tool_consumers.stage.json
7. Open it up and find your application by the name.
```
Update the following values:
   ?? is the url of you Canvas instance.

   "client_id": "97140000000000193",
   "iss": "https://canvas.instructure.com",
   "platformOIDCAuthEndPoint": "https://???.instructure.com/api/lti/authorize_redirect",
   "platformAccessTokenEndpoint": "https://??.instructure.com/login/oauth2/token",
   "platformPublicJWKEndpoint": "https://??.instructure.com/api/lti/security/jwks",
   "platformPublicKey": "",
   "deployment_id": "S",
   "toolApplicationUrl": "url of your frontend application, saved from step #### 7. Run amplify add hosting"
```
8. git add, commit and push your changes

You should now be able to run your application from your canvas instance.
