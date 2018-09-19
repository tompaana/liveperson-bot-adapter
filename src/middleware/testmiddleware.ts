import { MiddlewareSet, TurnContext } from 'botbuilder';

/**
 * Test middleware for testing/demonstrating the middleware handling capability of LivePersonBotAdapter.
 */
export class TestMiddleware extends MiddlewareSet {
    public async onTurn(context: TurnContext, next): Promise<any> {
        let adapterType = Object.prototype.toString.call(context.adapter);
        console.log(`Test middleware: TurnContext via ${adapterType}`);
        return Promise.resolve().then(await next());
    }
}
