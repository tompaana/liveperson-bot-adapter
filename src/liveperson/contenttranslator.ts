import {
    Activity,
    ChannelAccount,
    ConversationAccount,
    RoleTypes,
    SuggestedActions,
    TurnContext } from 'botbuilder';

import * as RichContentDefinitions from './richcontentdefinitions';

import { LivePersonBotAdapter } from './livepersonbotadapter';

/*
 * Translation map
 * 
 * | LivePerson  | Microsoft Bot Framework   |
 * |-------------|---------------------------|
 * | customerId  | Activity.channelData.id   |
 * | dialogId    | Activity.conversation.id  |
 * | message     | Activity.text             |
 * 
 */

 /**
  * Translates content format between the Microsoft Bot Framework and the LivePerson system.
  * 
  * More details on rich content in LivePerson:
  * - https://developers.liveperson.com/structured-content-templates-card.html
  * - https://developers.liveperson.com/messaging-agent-sdk-conversation-metadata-guide.html
  */
export class ContentTranslator {
    /**
     * Translates the given content to a TurnContext instance, which the bot can interpret.
     * 
     * @param contentEvent The content event to translate.
     * @param livePersonBotAdapter The LivePerson bot adapter.
     * @returns A newly created TurnContext instance based on the given content event.
     */
    public contentEventToTurnContext(contentEvent, livePersonBotAdapter: LivePersonBotAdapter): TurnContext {
        let channelAccount: ChannelAccount = {
            id: contentEvent.customerId,
            name: contentEvent.customerId,
            role: 'user'
        }

        let conversationAccount: ConversationAccount = {
            isGroup: false,
            conversationType: '',
            id: contentEvent.dialogId,
            name: '',
            role: RoleTypes.User,
        };

        let turnContext: TurnContext =
            new TurnContext(livePersonBotAdapter, {
                channelData: channelAccount,
                conversation: conversationAccount,
                channelId: 'liveperson',
                text: contentEvent.message,
                type: 'message',
             });

        return turnContext;
    }

    /**
     * Translates the given activity into LivePerson event.
     * 
     * @param activity The activity to translate.
     * @returns An event object ready to be used to send message via LivePerson.
     */
    public activityToLivePersonEvent(activity: Partial<Activity>): any {
        let event: object = {};

        if (activity.text !== undefined) {
            event = {
                type: 'ContentEvent',
                contentType: 'text/plain',
                message: activity.text
            }

            if (activity.suggestedActions !== undefined) {
                let quickReplies = this.suggestedActionsToLivePersonQuickReplies(activity.suggestedActions);
                event = { ...event, quickReplies };
            }
        } else if (activity.attachments !== undefined) {
            let richContent: RichContentDefinitions.RichContent = null;

            if (activity.attachmentLayout == 'carousel') {
                let elements = new Array<RichContentDefinitions.RichContent>();
    
                activity.attachments.forEach(element => {
                    elements.push(this.botFrameworkAttachmentToLivePersonCard(element.content));
                });
    
                richContent = new RichContentDefinitions.CarouselContent(elements);
            } else {
                richContent = this.botFrameworkAttachmentToLivePersonCard(activity.attachments[0].content);
            }
    
            if (activity.suggestedActions !== undefined) {
                richContent.quickReplies = this.suggestedActionsToLivePersonQuickReplies(activity.suggestedActions);
            }

            event = {
                type: 'RichContentEvent',
                content: richContent,
            }
        }

        return event;
    }

    /**
     * Translates the given suggested actions to LivePerson quick replies.
     * 
     * @param suggestedActions The suggested actions to translate.
     * @returns LivePerson quick replies.
     */
    protected suggestedActionsToLivePersonQuickReplies(suggestedActions: SuggestedActions): any {
        var quickReplies = new RichContentDefinitions.QuickReplies(4);

        if (suggestedActions !== undefined) {
            suggestedActions.actions.forEach(element => {
                quickReplies.replies.push(new RichContentDefinitions.QuickReply(element.value, element.title))
            });
        }

        return quickReplies;
    }

    /**
     * Translates the Bot Framework attachment content to LivePerson rich content.
     * 
     * @param botFrameworkAttachmentContent The Bot Framework attachment content (card).
     * @returns A newly created LivePerson card content instance.
     */
    protected botFrameworkAttachmentToLivePersonCard(botFrameworkAttachmentContent): RichContentDefinitions.CardContent {
        let elements = new Array<RichContentDefinitions.Element>();

        elements.push(new RichContentDefinitions.TextElement(
            botFrameworkAttachmentContent.title,
            botFrameworkAttachmentContent.title));
        
        if (botFrameworkAttachmentContent.subtitle !== undefined) {
            elements.push(new RichContentDefinitions.TextElement(
                botFrameworkAttachmentContent.title.subtitle,
                botFrameworkAttachmentContent.title.subtitle));
        }

        if (botFrameworkAttachmentContent.buttons !== undefined) {
            botFrameworkAttachmentContent.buttons.forEach(element => {
                if (element.type == 'imBack' || element.type == 'postBack') {
                    let action = new RichContentDefinitions.PostBackButtonAction(element.value);
                    elements.push(new RichContentDefinitions.Button(element.title, element.title, [action]));
                }

                if (element.type == 'openUrl') {
                    let action = new RichContentDefinitions.LinkButtonAction(element.title,element.value);
                    elements.push(new RichContentDefinitions.Button(element.title, element.title, [action])); 
                }
            });
        }

        let richContent: RichContentDefinitions.RichContent = {
            type: 'vertical',
            elements: elements
        };

        return richContent;
    }
}
