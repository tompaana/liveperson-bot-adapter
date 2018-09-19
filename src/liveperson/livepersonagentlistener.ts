import { EventEmitter } from 'events';

import ContentTranslator  from './contenttranslator';
import { LivePersonBotAdapter } from './livepersonbotadapter';

/**
 * Proxy class for events coming from the LivePerson system.
 */
export class LivePersonAgentListener extends EventEmitter {
    public static CONNECTED: string = 'lp_connected';
    public static MESSAGE: string = 'lp_message';

    /**
     * Forwards the event, when the bot is connected as an agent.
     * 
     * @param agentId The LivePerson assigned agent ID.
     */
    public onConnected(agentId: any) {
        this.emit(LivePersonAgentListener.CONNECTED, agentId);
    }

    /**
     * This method is called, when the LivePerson bot adapter receives an event (message) from a user.
     * 
     * The content is translated into TurnContext instance and forwarded to any code listening to the event.
     * 
     * @param livePersonBotAdapter The LivePerson bot adapter.
     * @param contentEvent The content event.
     */
    public onMessage(livePersonBotAdapter: LivePersonBotAdapter, contentEvent: any) {
        this.emit(
            LivePersonAgentListener.MESSAGE,
            ContentTranslator.contentEventToTurnContext(contentEvent, livePersonBotAdapter));
    }
}
