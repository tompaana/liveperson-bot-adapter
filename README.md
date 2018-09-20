# LivePerson Bot Adapter #

This is a sample bot to feature the LivePerson Bot adapter that enables the integration of the
Microsoft Bot Framework to the [LivePerson](https://www.liveperson.com/) care agent system.

## Getting started ##

0. Prerequisites:
    * Download and install [Node.js](https://nodejs.org/en/download/)
    * Access to LivePerson system to test the LivePerson adapter - LivePerson offers [a 30 day free trial](https://register.liveperson.com/product/233)
1. Install required packages and compile to JavaScript:

    ```
    npm install --save
    tsc
    ```
    
    You can also use the setup scripts that come with the project. How convenient!

2. Insert LivePerson [credentials](https://github.com/tompaana/liveperson-bot-adapter/blob/ac3d18aa743fbd80e37d6e950935f88eb41ef114/src/app.ts#L60) to
    * environment variables directly OR
    * run scripts ([`run.sh`](/run.sh) or [`run.bat`](/run.bat)) OR
    * [VS Code launch configuration](/.vscode/launch.json)

3. Run locally to see that everything works

    ```
    node main.js
    ```
    
    Or use the run scripts or the VS Code launch configuration to run using the IDE.

4. Play with the code, deploy etc.

## Resources ##

* [Microsoft Bot Framework developer documentation](https://dev.botframework.com/)
* [LivePerson developer documentation](https://developers.liveperson.com/)
* [LivePerson Agent Messaging SDK for Node.js](https://github.com/LivePersonInc/node-agent-sdk)
