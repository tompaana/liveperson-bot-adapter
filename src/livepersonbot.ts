import { ActivityTypes, TurnContext, ConversationState } from "botbuilder";
import { LivePersonBotAdapter } from "./liveperson/livepersonbotadapter";

const TURN_COUNTER_PROPERTY: string = 'turnCounterProperty';

export class LivePersonBot {
    private conversationState: ConversationState;
    private countProperty;

    /**
     *
     * @param {ConversationState} conversation state object
     */
    constructor(conversationState) {
        // Creates a new state accessor property.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors
        this.countProperty = conversationState.createProperty(TURN_COUNTER_PROPERTY);
        this.conversationState = conversationState;
    }

    /**
     *
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} on turn context object.
     */
    public async onTurn(turnContext: TurnContext) {
        const isViaLivePerson: boolean = (turnContext.adapter instanceof LivePersonBotAdapter);
        const viaString: string = isViaLivePerson ? 'via LivePerson' : 'via Bot Framework connector';

        // Handle message activity type. User's responses via text or speech or card interactions flow back to the bot as Message activity.
        // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
        // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        if (turnContext.activity.type === ActivityTypes.Message) {
            // read from state.
            let count = await this.countProperty.get(turnContext);
            count = count === undefined ? 1 : ++count;
            await turnContext.sendActivity(`${ count }: You said ${ viaString }: "${ turnContext.activity.text }"`);

            // Increment and set turn counter.
            await this.countProperty.set(turnContext, count);
        } else {
            // Generic handler for all other activity types.
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected ${ viaString }]`);
        }
        // Save state changes
        await this.conversationState.saveChanges(turnContext);
    }
}
