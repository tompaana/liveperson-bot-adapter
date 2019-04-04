import {
  Activity,
  ChannelAccount,
  ConversationAccount,
  RoleTypes,
  SuggestedActions,
  TurnContext
} from "botbuilder";

import * as RichContentDefinitions from "./richcontentdefinitions";

/**
 * Get day of month suffix
 * @param n day of month number
 * @return suffix
 **/
const getDayOfMonthSuffix = (n: number) => {
  if (n >= 1 && n <= 31) {
    return "";
  }

  if (n >= 11 && n <= 13) {
    return "th";
  }
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

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
    let event: any = {};

    if (activity.text !== undefined) {
      event = {
        type: "ContentEvent",
        contentType: "text/plain",
        message: activity.text
      };

      if (activity.suggestedActions !== undefined) {
        let quickReplies = this.suggestedActionsToLivePersonQuickReplies(
          activity.suggestedActions
        );
        event = { ...event, quickReplies };
      }
    }

    if (activity.attachments !== undefined) {
      let richContent: RichContentDefinitions.RichContent = null;

      if (activity.attachmentLayout == "carousel") {
        let elements = new Array<RichContentDefinitions.RichContent>();

        activity.attachments.forEach(element => {
          elements.push(
            this.botFrameworkAttachmentToLivePersonCard(element.content)
          );
        });

        richContent = new RichContentDefinitions.CarouselContent(elements);
      } else {
        richContent = this.botFrameworkAttachmentToLivePersonCard(
          activity.attachments[0].content
        );
      }

      if (activity.suggestedActions !== undefined) {
        richContent.quickReplies = this.suggestedActionsToLivePersonQuickReplies(
          activity.suggestedActions
        );
      }

      // event = {
      //     type: 'RichContentEvent',
      //     content: richContent,
      // }
      event.type = "RichContentEvent";
      event.content = richContent;
    }

    return event;
  }

  /**
   * Translates the given suggested actions to LivePerson quick replies.
   *
   * @param suggestedActions The suggested actions to translate.
   * @returns LivePerson quick replies.
   */
  protected suggestedActionsToLivePersonQuickReplies(
    suggestedActions: SuggestedActions
  ): any {
    var quickReplies = new RichContentDefinitions.QuickReplies(4);

    if (suggestedActions !== undefined) {
      suggestedActions.actions.forEach(element => {
        quickReplies.replies.push(
          new RichContentDefinitions.QuickReply(element.value, element.title)
        );
      });
    }

    return quickReplies;
  }

  /**
   * Convert the Bot Framework message to LivePerson message.
   *
   * @param botFrameworkMessage The Bot Framework message.
   * @returns LivePerson message.
   */
  protected botFrameworkMessageToLivePersonMessage(
    botFrameworkMessage: string
  ): string {
    const regex = /{{(.*?)}}/gi;
    const matches = botFrameworkMessage.match(regex);

    if (!matches) {
      return botFrameworkMessage;
    }

    const values = matches.map(m => m.slice(2, m.length - 2));

    const convertValues = values.map(value => {
      if (value.startsWith("DATE")) {
        const dateOptions = value.slice(5, value.length - 1).split(",");

        const date = new Date(dateOptions[0]);

        if (dateOptions[1].toLowerCase() === "long") {
          return `${days[date.getDay()]}, ${
            months[date.getMonth()]
          } ${date.getDate()}${getDayOfMonthSuffix(
            date.getDate()
          )}, ${date.getFullYear()}`;
        } else if (dateOptions[1].toLowerCase() === "short") {
          return `${days[date.getDay()].slice(0, 3)}, ${months[
            date.getMonth()
          ].slice(0, 3)} ${date.getDate()}${getDayOfMonthSuffix(
            date.getDate()
          )}, ${date.getFullYear()}`;
        } else {
          return `${date.getDate()}\/${date.getMonth()}\/${date.getFullYear()}`;
        }
      } else if (value.startsWith("TIME")) {
        const date = new Date(value.slice(5, value.length - 1));
        const h =
          date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`;
        const m =
          date.getMinutes() < 10
            ? `0${date.getMinutes()}`
            : `${date.getMinutes()}`;

        return `${h}:${m}`;
      } else {
        return value;
      }
    });

    let result = botFrameworkMessage;

    for (let i = 0; i < matches.length; i++) {
      result = result.replace(matches[i], convertValues[i]);
    }

    return result;
  }

  /**
   * Translates the Bot Framework items content to LivePerson elements.
   *
   * @param botFrameworkItem The Bot Framework item.
   * @param elements LivePerson elements container.
   */
  protected botFrameworkItemToLivePersonElement(
    botFrameworkItem: any,
    elements: Array<RichContentDefinitions.Element>
  ): void {
    const { type } = botFrameworkItem;

    if (type === RichContentDefinitions.ElementTypes.Container) {
      botFrameworkItem.items.forEach(columnItem => {
        this.botFrameworkItemToLivePersonElement(columnItem, elements);
      });
    } else if (type === RichContentDefinitions.ElementTypes.ColumnSet) {
      const horizontal = new RichContentDefinitions.Container("horizontal");
      elements.push(horizontal);
      botFrameworkItem.columns.forEach(columnItem => {
        this.botFrameworkItemToLivePersonElement(
          columnItem,
          horizontal.elements
        );
      });
    } else if (type === RichContentDefinitions.ElementTypes.Column) {
      const vertical = new RichContentDefinitions.Container("vertical");
      elements.push(vertical);
      botFrameworkItem.items.forEach(columnItem => {
        this.botFrameworkItemToLivePersonElement(columnItem, vertical.elements);
      });
    } else if (type === RichContentDefinitions.ElementTypes.FactSet) {
      const vertical = new RichContentDefinitions.Container("vertical");
      elements.push(vertical);
      botFrameworkItem.facts.forEach(fact => {
        const horizontal = new RichContentDefinitions.Container("horizontal");
        vertical.elements.push(horizontal);

        horizontal.elements.push(
          new RichContentDefinitions.TextElement(fact.title, fact.title, {
            bold: true
          })
        );
        horizontal.elements.push(
          new RichContentDefinitions.TextElement(fact.value, fact.value)
        );
      });
    } else if (type === RichContentDefinitions.ElementTypes.ImageSet) {
      const horizontal = new RichContentDefinitions.Container("horizontal");
      elements.push(horizontal);
      botFrameworkItem.images.forEach(image => {
        this.botFrameworkItemToLivePersonElement(image, horizontal.elements);
      });
    } else if (type === RichContentDefinitions.ElementTypes.TextBlock) {
      const { text, weight, size } = botFrameworkItem;

      const style: any = {};
      if (weight) {
        style.bold = weight === "bolder";
      }

      if (size) {
        style.size = size;
      }

      const leText = this.botFrameworkMessageToLivePersonMessage(text);

      elements.push(
        new RichContentDefinitions.TextElement(leText, leText, style)
      );
    } else if (type === RichContentDefinitions.ElementTypes.Image) {
      const { url } = botFrameworkItem;
      elements.push(new RichContentDefinitions.Image(url, "image tooltip"));
    }
  }

  /**
   * Translates the Bot Framework items content to LivePerson elements.
   *
   * @param action The Bot Framework item.
   * @param elements LivePerson elements container.
   */
  protected botFrameworkActionToLivePersonElement(
    action: any,
    elements: Array<RichContentDefinitions.Element>
  ): void {
    const { type, title } = action;

    if (type === "Action.OpenUrl") {
      const { url } = action;

      let buttonAction = new RichContentDefinitions.LinkButtonAction(
        title,
        url
      );

      elements.push(
        new RichContentDefinitions.Button(title, title, [buttonAction])
      );
    } else {
      let buttonAction = new RichContentDefinitions.PostBackButtonAction(
        action.value
      );
      elements.push(
        new RichContentDefinitions.Button(action.title, action.title, [])
      );
    }
  }

  /**
   * Translates the Bot Framework attachment content to LivePerson rich content.
   *
   * @param botFrameworkAttachmentContent The Bot Framework attachment content (card).
   * @returns A newly created LivePerson card content instance.
   */
  protected botFrameworkAttachmentToLivePersonCard(
    botFrameworkAttachmentContent
  ): RichContentDefinitions.CardContent {
    let elements = new Array<RichContentDefinitions.Element>();

    if (botFrameworkAttachmentContent.type === "AdaptiveCard") {
      const { body, actions } = botFrameworkAttachmentContent;

      // translate items
      body.forEach(item => {
        this.botFrameworkItemToLivePersonElement(item, elements);
      });

      // translate actions
      if (actions && actions.length) {
        const horizontal = new RichContentDefinitions.Container("horizontal");
        elements.push(horizontal);

        actions.forEach(action => {
          this.botFrameworkActionToLivePersonElement(
            action,
            horizontal.elements
          );
        });
      }
    } else {
      elements.push(
        new RichContentDefinitions.TextElement(
          botFrameworkAttachmentContent.title,
          botFrameworkAttachmentContent.title
        )
      );
    }

    if (botFrameworkAttachmentContent.subtitle !== undefined) {
      elements.push(
        new RichContentDefinitions.TextElement(
          botFrameworkAttachmentContent.title.subtitle,
          botFrameworkAttachmentContent.title.subtitle
        )
      );
    }

    if (botFrameworkAttachmentContent.buttons !== undefined) {
      botFrameworkAttachmentContent.buttons.forEach(element => {
        if (element.type == "imBack" || element.type == "postBack") {
          let action = new RichContentDefinitions.PostBackButtonAction(
            element.value
          );
          elements.push(
            new RichContentDefinitions.Button(element.title, element.title, [
              action
            ])
          );
        }

        if (element.type == "openUrl") {
          let action = new RichContentDefinitions.LinkButtonAction(
            element.title,
            element.value
          );
          elements.push(
            new RichContentDefinitions.Button(element.title, element.title, [
              action
            ])
          );
        }
      });
    }

    let richContent: RichContentDefinitions.RichContent = {
      type: "vertical",
      elements: elements
    };

    return richContent;
  }
}
