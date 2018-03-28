// 필드를 합치는 간편 함수
function smartJoin(arr, separator){
    if(!separator) separator = ' ';
    return arr.filter(function(elt){
	return elt!==undefined &&
	    elt!==null &&
	    elt.toString().trim() !== '';
    }).join(separator);
}
module.exports = function(customer, orders){
    return {
	firstName: customer.firstName,
	lastName: customer.lastName,
	name: smartJoin([customer.firstName, customer.lastName]),
	email: customer.email,
	address1: customer.address1,
	address2: customer.address2,
	city: customer.city,
	state: customer.state,
	zip: customer.zip,
	fullAddress: smartJoin([
	    customer.address1,
	    customer.address2,
	    customer.city + ', ' +
	    customer.state + ' ' +
	    customer.zip
	], '<br>'),
	phone: customer.phone,
	orders: orders.map(function(order){
	    return {
		orderNumber: order.orderNumber,
		date: order.date
		status: order.status,
		url: '/orders/' + order.orderNumber,
	    }
	}),
    }
}



var _ = require('underscore');

// 고객 뷰 모델 가져오기
function getCustomerViewModel(custoemr, orders){
    var vm = _.omit(customer, 'salesNotes');
    return _.extend(vm, {
	name: smartJoin([vm.firstName, vm.lastName]),
	fullAddress: smartJoin([
	    customer.address1,
	    customer.city + ', ' +
		customer.state + ' ' +
		customer.zip,
	], '<br>'),
	orders: orders.map(function(order){
	    return {
		orderNumber: order.orderNumber,
		date: order.date,
		status: order.status,
		url: '/orders/' + order.orderNumber,
	    };
	}),
    });
}
