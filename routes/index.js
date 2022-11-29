const controller = require('../controllers/controller')
const braintree = require("braintree");

const gateway = new braintree.BraintreeGateway({
  environment:  braintree.Environment.Sandbox,
  merchantId:   process.env.MF_MERCHANT_ID,
  publicKey:    process.env.MF_PUBLIC_KEY,
  privateKey:   process.env.MF_PRIVATE_KEY,
});

module.exports.routes = (app) => {
  app.get('/', function(req, res, next) {
    res.json('HELLO THERE')
  });

  app.get('/customer', async (req, res) => {
    // Customer response returns the payment methods for them.
    const id = req.query.customerId

    try {
      // https://developer.paypal.com/braintree/docs/reference/request/customer/find
      const result = await controller.getCustomerById(id)
      // console.log(result)
      // NOTE - this response does not appear to be a result object, just plain customer object
      if (result?.errors?.deepErrors().length) {
        // validation error case
        const deepErrors = result?.errors?.deepErrors();
        res.status(500).json({status: 500, error: deepErrors})
      }
      res.json({status: 200, result});
    } catch (err) {
      // When does BT throw an error vs returing the error in the results?
      console.log(err, 'Error thrown by BT')
      res.status(500).json({status: 500, error: err.message})
    }
  })

  app.post('/customer', async (req, res) => {
    try {
      // https://developer.paypal.com/braintree/docs/guides/customers#create
      const result = await controller.createCustomer(req.body)
      //console.log(result)
      if (result.success) {
        res.json({status: 200, result});
      } else if (result?.errors?.deepErrors().length) {
        // validation error case
        const deepErrors = result?.errors?.deepErrors();
        res.status(500).json({status: 500, error: deepErrors})
      } else {
        res.status(500).json({status: 500, result})
      }
    } catch (err) {
      // When does BT throw an error vs returing the error in the results?
      console.log(err, 'Error thrown by BT')
      res.status(500).json({status: 500, error: err})
    }
  })

  app.get('/transactionsByCustomerId', (req, res) => {
    const id = req.query.customerId

    const transactions = [];
    const errors = []
    // NOTE search is writable stream
    // https://developer.paypal.com/braintree/docs/reference/request/transaction/search
    const stream = gateway.transaction.search((search) => {
      search.customerId().is(id);
    })

    stream.on('data', (data) => {
      transactions.push(data)
    })

    stream.on('error', (error) => {
      errors.push(error)
    })

    stream.on('end', () => {
      // Status should be partial fulfill on errors
      return res.json({status: 200, transactions, errors})
    })

    stream.resume()

  })

  app.get("/clientToken", async (req, res) => {
    // Should either receive customer ID from client
    // or look it up based on user
    const customerId = req.query.customerId
    const tokenGenBody = customerId ? {customerId} : {}
    try {
      const result = await controller.generateClientToken(tokenGenBody)
      if (result.success) {
        res.json({status: 200, token: result.clientToken});
      } else {
        // What is this deep error shit? We can have one braintree error handler to map our codes
        const deepErrors = result?.errors?.deepErrors();
        res.status(500).json({status: 500, error: deepErrors})
      }

    } catch (err) {
      // When does BT throw an error vs returing the error in the results?
      console.log(err, 'Error thrown by BT')
      res.status(500).json({status: 500, error: err})
    }
  });

  app.post("/checkout", async (req, res) => {
    try {
      // this result has ALOT of data
      const result = await controller.createSaleTransaction(req.body)
      // See https://developer.paypal.com/braintree/docs/reference/response/transaction#result-object
      if (result.success) {
        res.json({status: 200, result});
      } else if (result?.errors?.deepErrors().length) {
        // validation error case
        console.log(result?.errors?.deepErrors(), 'DEEP ERROS')
        const deepErrors = result?.errors?.deepErrors();
        res.status(500).json({status: 500, error: deepErrors})
      } else {
        // at least 3 other kinds of errors, gateway, processor, etc
        // where success is true
        res.status(500).json({status: 500, result})
      }
    } catch (err) {
      // When does BT throw an error vs returing the error in the results?
      console.log(err, 'Error thrown by BT')
      res.status(500).json({status: 500, error: err})
    }

  });

  app.post('/purchaseUsingVaultedPMT', async (req, res) => {
    try {
      const result = await controller.purchaseUsingVaultedPMT(req.body)
      // See https://developer.paypal.com/braintree/docs/reference/response/transaction#result-object
      if (result.success) {
        res.json({status: 200, result});
      } else if (result?.errors?.deepErrors().length) {
        // validation error case
        console.log(result?.errors?.deepErrors(), 'DEEP ERROS')
        const deepErrors = result?.errors?.deepErrors();
        res.status(500).json({status: 500, error: deepErrors})
      } else {
        // at least 3 other kinds of errors, gateway, processor, etc
        // where success is true
        res.status(500).json({status: 500, result})
      }
    } catch (err) {
      // When does BT throw an error vs returing the error in the results?
      console.log(err, 'Error thrown by BT')
      res.status(500).json({status: 500, error: err})
    }

  })



}
