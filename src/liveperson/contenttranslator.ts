import {
    Activity,
    ChannelAccount,
    ConversationAccount,
    RoleTypes,
    SuggestedActions,
    TurnContext } from 'botbuilder';

import {
    Button,
    CardContent,
    CarouselContent,
    Element,
    LinkButtonAction,
    PostBackButtonAction,
    RichContent,
    TextElement,
    QuickReplies,
    QuickReply } from './richcontent'

import { LivePersonBotAdapter } from './livepersonbotadapter';

/*
 * Translation map
 * 
 * | LivePerson     | Microsoft Bot Framework              |
 * |----------------|--------------------------------------|
 * | dialogId       | Activity.conversation.id             |
 * | message        | Activity.text                        |
 */

 /**
  * Translates content format between the Microsoft Bot Framework and the LivePerson system.
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
        let channelData: ChannelAccount = 
        {
            id:contentEvent.customerId,
            name:contentEvent.customerId,
            role: "user"
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
                channelData: channelData,
                conversation: conversationAccount,
                channelId:"LivePerson",
                text: contentEvent.message,
                type: 'message',
             });

        return turnContext;
    }

    /**
     * We can display only One Card at a time!!!
     * Translates the Microsoft Bot Framework rich content format (e.g. adaptive cards, messages
     * with buttons etc.) into the LivePerson rich content format.
     * See more details on rich content in LP here: https://developers.liveperson.com/structured-content-templates-card.html
     * and here https://developers.liveperson.com/messaging-agent-sdk-conversation-metadata-guide.html
     * 
     * @param cards list of attachments
     * @returns
     */
    public msBotHeroCardsToLivePersonMessage(activity :Partial<Activity>): RichContent {

        if(activity.attachmentLayout == "carousel"){
            
            let elements = new Array<RichContent>();
            activity.attachments.forEach(element => {
                elements.push(this.createCard(element.content));
            });
            let carousel : CarouselContent = new CarouselContent(elements);
            console.log(JSON.stringify(carousel));
            return carousel;
        }
        else
        {
            return this.createCard(activity.attachments[0].content);
        }
        
    }

    createCard(card): CardContent
    {
        let elements = new Array<Element>();
        elements.push(new TextElement(card.title,card.title));
        
        //First we are going to push title and subtitle
        if(card.subtitle != undefined)
            elements.push(new TextElement(card.title.subtitle,card.title.subtitle));
    
        // if(card.images != undefined)
        // {
        //     card.images.forEach(element => {
        //         elements.push(new Image(element.url, "tooltip"));
        //     });
        // }

        if(card.buttons != undefined)
        {
            card.buttons.forEach(element => {
                if(element.type == "imBack" || element.type == "postBack"){
                    let action = new PostBackButtonAction(element.value);
                    elements.push(new Button(element.title, element.title,[action]));
                }
                if(element.type == "openUrl")
                {
                    let action = new LinkButtonAction(element.title,element.value);
                    elements.push(new Button(element.title, element.title,[action])); 
                }
            
            });
        }

        //First creating content of object and then only create object using interface
        var richContent : RichContent = {type: "vertical", elements: elements};
        return richContent;
    }

    /**
     * We can display only One Card at a time!!!
     * Translates the Microsoft Bot Framework rich content format (e.g. adaptive cards, messages
     * with buttons etc.) into the LivePerson rich content format.
     * See more details on rich content in LP here: https://developers.liveperson.com/structured-content-templates-card.html
     * and here https://developers.liveperson.com/messaging-agent-sdk-conversation-metadata-guide.html
     * 
     * @param suggestedActions 
     * @returns
     */
    public msBotMessageWithSuggestedActionsToLPQuickReplies(suggestedActions: SuggestedActions): any {
        var quickReplies = new QuickReplies(4);

        if (suggestedActions !== undefined) {
            suggestedActions.actions.forEach(element => {
                quickReplies.replies.push(new QuickReply(element.value, element.title))
            });
        }

        return quickReplies;
    }
}

export default new ContentTranslator();
