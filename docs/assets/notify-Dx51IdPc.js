import{z as c}from"./index-CelrPNDw.js";const u="919152856405";function d(e){const t=e.customerName?e.customerName.trim().split(/\s+/)[0]:"there",n=e.orderId.length>8?e.orderId.slice(0,8):e.orderId,r=e.items.map(o=>{const a=o.variant?` [${c(o.variant)}]`:"",i=o.packItems&&o.packItems.length?`
   ↳ ${o.packItems.join(", ")}`:"";return`• ${o.name}${a} × ${o.quantity} — ₹${o.lineTotal.toFixed(2)}${i}`});return[`Hi ${t},`,"","Thank you for your order with Food on the Move.","","Your order has been confirmed successfully.","",`*Order ID:* #${n}`,`*Order Total:* ₹${e.total.toFixed(2)}`,"","*Items Ordered:*",...r,"","We’ll notify you once your order is shipped.","","Thank you for shopping with us.","","Team Food on the Move"].join(`
`)}function h(e){const t=e.replace(/\D/g,"");return t.length===10?`91${t}`:t}function p(e){return`https://wa.me/${u}?text=${encodeURIComponent(e)}`}function l(e,t){return`https://wa.me/${h(e)}?text=${encodeURIComponent(t)}`}function $(e,t,n){const r=e?e.trim().split(/\s+/)[0]:"there",s=t.length>8?t.slice(0,8):t;return`Hi ${r},

This is Food on the Move regarding your order #${s}.
Status: *${n}*

Thank you for choosing us! 🍿🍪

Team Food on the Move`}function f(e,t){return`https://www.google.com/maps?q=${e},${t}`}export{$ as a,d as b,l as c,f as g,p as w};
