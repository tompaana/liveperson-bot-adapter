/**
 * @member elements rich content, text, images, buttons
 * @member type - vertical or horizontal
 * @member quickReplies - suggested actions
 */
export class RichContent {
  elements: Array<any> | undefined;
  quickReplies?: QuickReplies;
  type: string;
}

export class CardContent extends RichContent {
  constructor() {
    super();
    this.type = "vertical";
  }
}

export class CarouselContent extends RichContent {
  padding: number;

  constructor(elements: Array<RichContent>) {
    super();
    this.elements = elements;
    this.type = "carousel";
    this.padding = 10;
  }
}

/**
 * Base class for rich elements
 *
 * @member type text, image, button
 */
export class Element {
  protected type: string;
}

/**
 * Base class for elements containing tooltip
 */
export class ElementWithTooltip extends Element {
  protected tooltip: string;
}

/**
 * Button element class
 *
 * @member click determines behaviour of button
 */
export class Button extends ElementWithTooltip {
  readonly title: string;
  readonly metadata: any;
  readonly click: any;

  constructor(
    tooltip: string,
    title: string,
    buttonActions: Array<ButtonActions>
  ) {
    super();
    this.type = "button";
    this.tooltip = tooltip;
    this.title = title;
    this.click = { actions: buttonActions };
  }
}

/**
 * Base ButtonActions class
 */
export class ButtonActions {
  protected type: string;
}

/**
 * LinkButtonAction - open URL button action
 */
export class LinkButtonAction extends ButtonActions {
  readonly name: string;
  readonly uri: string;

  constructor(name: string, uri: string) {
    super();
    this.name = name;
    this.uri = uri;
    this.type = "link";
  }
}

/**
 * Send text button action
 */
export class PostBackButtonAction extends ButtonActions {
  readonly text: string;

  constructor(text: string) {
    super();
    this.text = text;
    this.type = "publishText";
  }
}

/**
 * Text element style
 * @TODO update for all posible text style properties
 */
export interface ITextElementStyle {
  size?: string;
  color?: string;
  bold?: boolean;
}

/**
 * Text element
 *
 */
export class TextElement extends ElementWithTooltip {
  readonly text: string;
  readonly style: ITextElementStyle;

  constructor(text: string, tooltip: string, style: ITextElementStyle = {}) {
    super();
    this.type = "text";
    this.text = text;
    this.tooltip = tooltip;
    const keys = Object.keys(style);
    if (keys.length) {
      this.style = style;
    }
  }
}

/**
 * Image element
 *
 * Note that the URL must be whitelisted in the LivePerson service
 */
export class Image extends ElementWithTooltip {
  readonly url: string;

  constructor(url: string, tooltip: string) {
    super();
    this.type = "image";
    this.tooltip = tooltip;
    this.url = url;
  }
}

/**
 * Suggested action button
 */
export class QuickReply {
  readonly type: string;
  readonly tooltip: string;
  readonly title: string;
  readonly click: any;

  constructor(value: string, title: string) {
    this.type = "button";
    this.tooltip = title;
    this.title = title;
    this.click = {
      actions: [new PostBackButtonAction(value)],
      metadata: [{ type: "ExternalId", id: "ExternalIdValue" }]
    };
  }
  TextElement;
}
TextElement;
/**
 * Suggested actions
 */
export class QuickReplies extends Element {
  replies: Array<QuickReply>;
  readonly itemsPerRow: number;

  constructor(itemsPerRow: number) {
    super();
    this.itemsPerRow = itemsPerRow;
    this.type = "quickReplies";
    this.replies = new Array<QuickReply>();
  }
}

export class Container extends Element {
  elements: Array<Element>;

  constructor(containerType: "vertical" | "horizontal") {
    super();
    this.type = containerType;
    this.elements = new Array<Element>();
  }
}

export enum ElementTypes {
  Container = "Container",
  ColumnSet = "ColumnSet",
  Column = "Column",
  FactSet = "FactSet",
  TextBlock = "TextBlock",
  ImageSet = "ImageSet",
  Image = "Image",
  Media = "Media"
}
