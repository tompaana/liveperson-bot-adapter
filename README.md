# LivePerson Bot Adapter #

This is a sample bot to feature the LivePerson Bot adapter that enables the integration of the
Microsoft Bot Framework to the [LivePerson](https://www.liveperson.com/) care agent system.
In addition to simply revieving and sending messages, with the help of the
[LivePerson Agent SDK](https://github.com/LivePersonInc/node-agent-sdk) the adapter unlocks all the
features of the LivePerson service, such as transferring the conversation to a human care agent.
Note that for some features additional code may be required.

![LivePerson Bot Adapter overview](/doc/liveperson-bot-adapter-overview.png)

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

## Implementation ##

The heart of the project is the adapter class itself:
[LivePersonBotAdapter](/src/liveperson/livepersonbotadapter.ts). The key principle of this approach
is that one could simply replace the typically used
[BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest)
with the `LivePersonBotAdapter` class.
You can also run both in parallel! For isntance, you can reach the channels not supported by
LivePerson using the Microsoft Bot Connector service. What makes this approach nice is that **no
changes to the bot conversational logic (code) is required**!

Using `BotFrameworkAdapter`:

```js
const botFrameworkAdapter = new BotFrameworkAdapter({ 
    // Bot Framework credentials
});

botFrameworkAdapter.use(myMiddleware);

// server is a restify server
server.post("/api/messages", (request, response) => {
    botFrameworkAdapter.processActivity(request, response, async (context) => {
        // Bot logic code
    });
});
```

Using `LivePersonBotAdapter`:

```js
const livePersonBotAdapter = new LivePersonBotAdapter({
    // LivePerson credentials
});

livePersonBotAdapter.use(myMiddleware);

livePersonBotAdapter.getListener().on(LivePersonAgentListener.MESSAGE, async (context) => {
    (context.adapter as LivePersonBotAdapter).runMiddleware(context, async (context) => {
        // Bot logic code
    });
});
```


## Resources ##

* [Microsoft Bot Framework developer documentation](https://dev.botframework.com/)
* [LivePerson developer documentation](https://developers.liveperson.com/)
* [LivePerson Agent Messaging SDK for Node.js](https://github.com/LivePersonInc/node-agent-sdk)
