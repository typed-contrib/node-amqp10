/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10#flow-control-and-message-dispositions
 */

import * as amqp from "amqp10";
import Policy = amqp.Policy;

const client = new amqp.Client(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue));

// equivalent to

const manual = new amqp.Client(Policy.merge({
    receiverLink: {
        creditQuantum: 1,
        credit: function (link: amqp.ReceiverLink, options: any) {
            // If the receiver link was just connected, set the initial link credit to the quantum. Otherwise, give more credit for every message we've settled.
            const creditQuantum = (!!options && options.initial) ? link.policy.creditQuantum : link.settledMessagesSinceLastCredit;
            if (creditQuantum > 0 && link.linkCredit < 1) {
                link.addCredits(creditQuantum);
            }
        },
        attach: {
            receiverSettleMode: amqp.Constants.receiverSettleMode.settleOnDisposition
        }
    }
}))
