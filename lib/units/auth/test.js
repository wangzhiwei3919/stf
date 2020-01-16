var request = require('request')

var httpOptions = {
        // hostname: `http://admin.soloyuedu.com/api/admin/seller/order/${req.query.orderId}/info`,
        hostname: 'http://admin.soloyuedu.com',
        port: 80,
        path: '/api/admin/seller/order/92404921921/info',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'cookie': 'token=316a3bb681e8435bf6ec28332122611b'
        }
	  }

request({
	url: httpOptions.hostname + httpOptions.path,
	method: "POST",
	headers: httpOptions.headers
}, function(error, response, body) {
	console.log('body', body)
	if (!error && response.statusCode == 200) {
		console.log(JSON.parse(body).data)
	}
}); 