import { Agent } from 'node-agent-sdk';
import { BotAdapter, Promiseable, TurnContext } from 'botbuilder';
import { Activity, ConversationReference } from 'botframework-schema';

import { ContentTranslator } from './contenttranslator';
import { LivePersonAgentListener } from './livepersonagentlistener';

/**
 * LivePerson bot adapter.
 * 
 * This is the proxy between the LivePerson system and the bot logic.
 * 
 * See https://github.com/LivePersonInc/node-agent-sdk for LivePerson Agent SDK documentation/code.
 */
export class LivePersonBotAdapter extends BotAdapter {
    private livePersonAgent: Agent = null;
    private contentTranslator: ContentTranslator = null;
    private livePersonAgentListener: LivePersonAgentListener = null;
    private _isConnected: boolean = false;

    /**
     * Constructor.
     * 
     * @param livePersonConfiguration The LivePerson configuration including the credentials.
     */
    constructor(livePersonConfiguration: any) {
        super();

        try {
            this.livePersonAgent = new Agent(livePersonConfiguration);
            this.initializeLivePersonAgent();
        } catch (error) {
            console.error(`Failed to create/initialize the LivePerson agent: ${error}`)
        }

        this.contentTranslator = new ContentTranslator();
        this.livePersonAgentListener = new LivePersonAgentListener(this.contentTranslator);
    }

    /**
     * @returns True, if this bot is connected as a LivePerson agent. False otherwise.
     */
    public isConnected(): boolean {
        return this._isConnected;
    }

    /**
     * @returns The LivePerson agent (event) listener.
     */
    public getListener(): LivePersonAgentListener {
        return this.livePersonAgentListener;
    }

    /**
     * From BotAdapter.
     * Sends the replies of the bot to the LivePerson system after the content translation.
     * 
     * See https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botbuilder/src/botFrameworkAdapter.ts#L500 for reference.
     * 
     * @param context Context for the current turn of conversation with the user.
     * @param activities List of activities to send.
     */
    public sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<any> {    
        return new Promise<boolean>((resolve, reject) => {  
            if (!this.livePersonAgent) {
                reject('No LivePerson agent instance');
                return;
            }

            activities.forEach(activity => {
                let event = this.contentTranslator.activityToLivePersonEvent(activity);

                if (event.type == 'RichContent') {
                    this.livePersonAgent.publishEvent({
                        dialogId: activity.conversation.id,
                        event: event
                    }, this.logErrorMessage, [{type: 'ExternalId', id: 'MY_CARD_ID'}]);
                } else {
                    this.livePersonAgent.publishEvent({
                        dialogId: activity.conversation.id, // equals LivePerson's dialogId 
                        event: event     
                    });
                }
            });

            resolve(true);
        });;
    }

    /**
     * Transfers the conversation matching the given dialog ID to another agent.
     * 
     * @param dialogId The LivePerson dialog ID.
     * @param targetSkillId The skill the new agent needs to have.
     */
    public transferToAnotherAgent(dialogId, targetSkillId) {
        this.livePersonAgent.updateConversationField({
            'conversationId': dialogId,
                'conversationField': [
                    {
                        'field': 'ParticipantsChange',
                        'type': 'REMOVE',
                        'role': 'ASSIGNED_AGENT'
                    },
                    {
                        'field': 'Skill',
                        'type': 'UPDATE',
                        'skill': targetSkillId
                    }
                ]
            }, (e, resp) => {
                if (e) {
                    console.error(e)
                }

                console.log(resp);
            });
    }

    /**
     * Exposes the runMiddleware method, which is a protected method defined in BotAdapter.
     * Call this method explicitly to let the middleware layer to process the context.
     * 
     * @param context 
     * @param next 
     */
    public runMiddleware(context: TurnContext, next: (revocableContext: TurnContext) => Promise<void>): Promise<void> {
        return super.runMiddleware(context, next);
    }

    /**
     * This method is not implemented for this (LivePerson) bot adapter.
     * Use runMiddleware() to execute the middleware stack.
     */
    public processActivity(req, res, logic: (context: TurnContext) => Promise<any>): Promise<void> {
        throw new Error("processActivity method is not implemented for LivePersonBotAdapter");
    }

    public continueConversation(reference: Partial<ConversationReference>, logic: (revocableContext: TurnContext) => Promiseable<any>): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<any> {
        throw new Error("Method not implemented.");
    }

    /**
     * Initializes the LivePerson agent; subscribes to events and sets the agent status online.
     * The event handlers here will forward the selected events to bot logic using the
     * LivePersonAgentListener class.
     * 
     * The content of thiss method is based the code, in LivePerson repository, licensed under MIT
     * (copyrighted by LivePerson):
     * - Code: https://github.com/LivePersonInc/node-agent-sdk/blob/master/examples/agent-bot/MyCoolAgent.js
     * - License: https://github.com/LivePersonInc/node-agent-sdk/blob/master/LICENSE
     */
    protected initializeLivePersonAgent() {
        if (!this.livePersonAgent) {
            console.error('No LivePerson agent to initialize');
            return;
        }

        let openConvs = {};

        this.livePersonAgent.on('connected', msg => {
            this._isConnected = true;
            console.log('LivePerson agent connected:', this.livePersonAgent.conf.id || '', msg);
            this.livePersonAgent.setAgentState({availability: 'ONLINE'});
            this.livePersonAgent.subscribeExConversations({
                'agentIds': [this.livePersonAgent.agentId],
                'convState': ['OPEN']
            }, (e, resp) => console.log('subscribeExConversations', this.livePersonAgent.conf.id || '', resp || e));
            this.livePersonAgent.subscribeRoutingTasks({});
            this.livePersonAgent._pingClock = setInterval(this.livePersonAgent.getClock, 30000);

            this.livePersonAgentListener.onConnected(this.livePersonAgent.agentId);
        });

        // Accept any routingTask (==ring)
        this.livePersonAgent.on('routing.RoutingTaskNotification', body => {
            body.changes.forEach(c => {
                if (c.type === 'UPSERT') {
                    c.result.ringsDetails.forEach(r => {
                        if (r.ringState === 'WAITING') {
                            this.livePersonAgent.updateRingState({
                                'ringId': r.ringId,
                                'ringState': 'ACCEPTED'
                            }, (e, resp) => console.log(resp));
                        }
                    });
                }
            });
        });

        // Notification on changes in the open conversation list
        this.livePersonAgent.on('cqm.ExConversationChangeNotification', notificationBody => {
            notificationBody.changes.forEach(change => {
                if (change.type === 'UPSERT' && !openConvs[change.result.convId]) {
                    // new conversation for me
                    openConvs[change.result.convId] = {};

                    // demonstration of using the consumer profile calls
                    const consumerId = change.result.conversationDetails.participants.filter(p => p.role === 'CONSUMER')[0].id;
                    this.livePersonAgent.getUserProfile(consumerId, (e, profileResp) => {
                        this.livePersonAgent.publishEvent({
                            dialogId: change.result.convId,
                            event: {
                                type: 'ContentEvent',
                                contentType: 'text/plain',
                                message: `Just joined to conversation with ${JSON.stringify(profileResp)}`
                            }
                        });
                    });
                    this.livePersonAgent.subscribeMessagingEvents({dialogId: change.result.convId});
                } else if (change.type === 'DELETE') {
                    // conversation was closed or transferred
                    delete openConvs[change.result.convId];
                }
            });
        });

        this.livePersonAgent.on('ms.MessagingEventNotification',  body => {
			let consumerId: string = "";
            const respond = {};
            body.changes.forEach(c => {
                // In the current version MessagingEventNotification are recived also without subscription
                // Will be fixed in the next api version. So we have to check if this notification is handled by us.
                if (openConvs[c.dialogId]) {
                    // add to respond list all content event not by me
                    if (c.event.type === 'ContentEvent' && c.originatorId !== this.livePersonAgent.agentId) {
						consumerId = c.originatorId;
						
                        respond[`${body.dialogId}-${c.sequence}`] = {
                            dialogId: body.dialogId,
                            sequence: c.sequence,
                            message: c.event.message
                        };
                    }
                    // remove from respond list all the messages that were already read
                    if (c.event.type === 'AcceptStatusEvent' && c.originatorId === this.livePersonAgent.agentId) {
                        c.event.sequenceList.forEach(seq => {
                            delete respond[`${body.dialogId}-${seq}`];
                        });
                    }
                }
            });

            // publish read, and echo
            Object.keys(respond).forEach(key => {
                let contentEvent = respond[key];
                this.livePersonAgent.publishEvent({
                    dialogId: contentEvent.dialogId,
                    event: {type: 'AcceptStatusEvent', status: 'READ', sequenceList: [contentEvent.sequence]}
                });

                // Notify listener to process the received message and attach customerId from LivePerson to the message
                this.livePersonAgent.getUserProfile(consumerId, (e, profileResp) => {
                    let customerId:string = "";
					if(profileResp != undefined){
                        let ctmrInfo =  profileResp.filter(pr => pr.type == "ctmrinfo")[0];
                        customerId = ctmrInfo.info.customerId;
                    }
                    let event = {...contentEvent, customerId};
                    this.livePersonAgentListener.onMessage(this, event);    
                });
            });
        });

        // Tracing
        this.livePersonAgent.on('error', err => this.logErrorMessage(err));
        this.livePersonAgent.on('closed', data => {
            // For production environments ensure that you implement reconnect logic according to
            // liveperson's retry policy guidelines: https://developers.liveperson.com/guides-retry-policy.html
            console.log('LivePerson agent socket closed', data);
            clearInterval(this.livePersonAgent._pingClock);
        });
    }

    protected logErrorMessage(error) {
        console.error(`LivePerson bot adapter error: ${error}`);
    }
}
