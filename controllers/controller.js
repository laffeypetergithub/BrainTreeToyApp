const braintree = require("braintree");

const gateway = new braintree.BraintreeGateway({
  environment:  braintree.Environment.Sandbox,
  merchantId:   process.env.MF_MERCHANT_ID,
  publicKey:    process.env.MF_PUBLIC_KEY,
  privateKey:   process.env.MF_PRIVATE_KEY,
});

const controller = {
  getCustomerById: async (id) => {
    return gateway.customer.find(id)
  },

  createCustomer: async (context) => {
     // we should sync with Legal on how much customer data we should pass
    // though we do pass similar to adyen
    const {firstName, lastName, email, phone, id} = context;
    return gateway.customer.create({
      firstName,
      lastName,
      email,
      phone,
      id
    })
  },

  generateClientToken: async (context) => {
    return gateway.clientToken.generate(context)
  },

  createSaleTransaction: async (context) => {
    const {
      paymentMethodNonce,
      deviceData,
      isVaultFlow,
      customer,
      isExistingCustomer,
      amount
    } = context;

    const saleData = {
      amount,
      paymentMethodNonce,
      deviceData,
      options: {
        submitForSettlement: true, // We should actually not submit until entitlements are granted.
      }
    }

    if (isExistingCustomer) {
      // ties this transaction to an existing customer
      console.log(`Creating transaction for customer ${JSON.stringify(customer)}`)
      saleData.customerId = customer.id
    } else if (!isExistingCustomer && customer) {
      // creates a customer and a transaction in one go
      console.log(`Creating transaction and customer for customer ${JSON.stringify(customer)}`)
      saleData.customer = customer
    } else (
      // would this still associate it with a customer, via the nonce???
      console.log(`Creating transaction not associated with customer...`)

    )

    if (isVaultFlow) {
      saleData.options.storeInVaultOnSuccess = true;
    }

    return await gateway.transaction.sale(saleData)
  },

  purchaseUsingVaultedPMT: async (context) => {
    const {customerId, amount} = context;
    const customer = await controller.getCustomerById(customerId);
    if (!customer) throw new Error('No customer found')
    // same data is in customer.paymentMethods...??
    const defaultPaymentMethod = customer.paypalAccounts.filter((method) => {
       return method.default === true;
    }).pop()
    console.log(defaultPaymentMethod)
    if (!defaultPaymentMethod) throw new Error('No default payment method')
    const paymentMethodToken = defaultPaymentMethod.token;
    return gateway.transaction.sale({
      amount,
      // could also pass customerId and it would use their default payment method
      paymentMethodToken
    })
  }

}

module.exports = controller;
