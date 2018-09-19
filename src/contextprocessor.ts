import { ConversationState, TurnContext } from "botbuilder";
import { LivePersonBotAdapter } from "./liveperson/livepersonbotadapter";

/**
 * Defines the attributes of the conversation state.
 */
export interface MyConversationState {
    count: number;
}

/**
 * Contains the conversational logic.
 */
export class ContextProcessor {
    private conversationState: ConversationState;
    
    constructor(conversationState: ConversationState) {
        this.conversationState = conversationState;
    }
    
    public async processContext(context: TurnContext) {
        const isMessage: boolean = context.activity.type === 'message';

        if (isMessage) {
            const isViaLivePerson: boolean = (context.adapter instanceof LivePersonBotAdapter);
            const conversationState = this.conversationState.get(context);
            conversationState.count++;

            if (isViaLivePerson) {
                await context.sendActivity(`${conversationState.count}: You said via LivePerson: ${context.activity.text}`);
            } else {
                await context.sendActivity(`${conversationState.count}: You said via Bot Framework connector: ${context.activity.text}`);
            }
        }
    }
}
