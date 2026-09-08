import{z as c}from"./index-Czsml_wl.js";const d="919152856405";function m(e){const t=e.customerName?e.customerName.trim().split(/\s+/)[0]:"there",n=e.orderId.length>8?e.orderId.slice(0,8):e.orderId,r=e.items.map(o=>{const a=o.variant?` [${c(o.variant)}]`:"",i=o.packItems&&o.packItems.length?`
   ↳ ${o.packItems.join(", ")}`:"";return`• ${o.name}${a} × ${o.quantity} — ₹${o.lineTotal.toFixed(2)}${i}`});return[`Hi ${t},`,"","Thank you for your order with Food on the Move.","","Your order has been confirmed successfully.","",`*Order ID:* #${n}`,`*Order Total:* ₹${e.total.toFixed(2)}`,"","*Items Ordered:*",...r,"","We’ll notify you once your order is shipped.","","Thank you for shopping with us.","","Team Food on the Move"].join(`
`)}function u(e){const t=e.replace(/\D/g,"");return t.length===10?`91${t}`:t}function h(e){return`https://wa.me/${d}?text=${encodeURIComponent(e)}`}function p(e,t){return`https://wa.me/${u(e)}?text=${encodeURIComponent(t)}`}function f(e,t,n){const r=e?e.trim().split(/\s+/)[0]:"there",s=t.length>8?t.slice(0,8):t;return`Hi ${r},

This is Food on the Move regarding your order #${s}.
Status: *${n}*

Thank you for choosing us! 🍿🍪

Team Food on the Move`}function $(e,t){return`https://www.google.com/maps?q=${e},${t}`}async function g(e){try{const n=await(await fetch("/api/send-order-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).json();return console.log("Order email notification response:",n),n}catch(t){return console.error("Failed to send order email notification:",t),{success:!1,error:t?.message}}}export{f as a,m as b,p as c,$ as g,g as s,h as w};
