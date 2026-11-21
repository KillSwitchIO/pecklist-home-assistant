/* PeckList card 0.1.0 - MIT - https://github.com/KillSwitchIO/pecklist-home-assistant */
var it=globalThis,at=it.ShadowRoot&&(it.ShadyCSS===void 0||it.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,vt=Symbol(),Nt=new WeakMap,X=class{constructor(n,t,e){if(this._$cssResult$=!0,e!==vt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=n,this.t=t}get styleSheet(){let n=this.o,t=this.t;if(at&&n===void 0){let e=t!==void 0&&t.length===1;e&&(n=Nt.get(t)),n===void 0&&((this.o=n=new CSSStyleSheet).replaceSync(this.cssText),e&&Nt.set(t,n))}return n}toString(){return this.cssText}},Wt=r=>new X(typeof r=="string"?r:r+"",void 0,vt),bt=(r,...n)=>{let t=r.length===1?r[0]:n.reduce((e,s,i)=>e+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+r[i+1],r[0]);return new X(t,r,vt)},jt=(r,n)=>{if(at)r.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of n){let e=document.createElement("style"),s=it.litNonce;s!==void 0&&e.setAttribute("nonce",s),e.textContent=t.cssText,r.appendChild(e)}},$t=at?r=>r:r=>r instanceof CSSStyleSheet?(n=>{let t="";for(let e of n.cssRules)t+=e.cssText;return Wt(t)})(r):r;var{is:Ae,defineProperty:Ee,getOwnPropertyDescriptor:Te,getOwnPropertyNames:Se,getOwnPropertySymbols:Ie,getPrototypeOf:Ce}=Object,rt=globalThis,Bt=rt.trustedTypes,De=Bt?Bt.emptyScript:"",Re=rt.reactiveElementPolyfillSupport,Z=(r,n)=>r,wt={toAttribute(r,n){switch(n){case Boolean:r=r?De:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,n){let t=r;switch(n){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},Ft=(r,n)=>!Ae(r,n),Vt={attribute:!0,type:String,converter:wt,reflect:!1,useDefault:!1,hasChanged:Ft};Symbol.metadata??=Symbol("metadata"),rt.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(n){this._$Ei(),(this.l??=[]).push(n)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(n,t=Vt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(n)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(n,t),!t.noAccessor){let e=Symbol(),s=this.getPropertyDescriptor(n,e,t);s!==void 0&&Ee(this.prototype,n,s)}}static getPropertyDescriptor(n,t,e){let{get:s,set:i}=Te(this.prototype,n)??{get(){return this[t]},set(a){this[t]=a}};return{get:s,set(a){let l=s?.call(this);i?.call(this,a),this.requestUpdate(n,l,e)},configurable:!0,enumerable:!0}}static getPropertyOptions(n){return this.elementProperties.get(n)??Vt}static _$Ei(){if(this.hasOwnProperty(Z("elementProperties")))return;let n=Ce(this);n.finalize(),n.l!==void 0&&(this.l=[...n.l]),this.elementProperties=new Map(n.elementProperties)}static finalize(){if(this.hasOwnProperty(Z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Z("properties"))){let t=this.properties,e=[...Se(t),...Ie(t)];for(let s of e)this.createProperty(s,t[s])}let n=this[Symbol.metadata];if(n!==null){let t=litPropertyMetadata.get(n);if(t!==void 0)for(let[e,s]of t)this.elementProperties.set(e,s)}this._$Eh=new Map;for(let[t,e]of this.elementProperties){let s=this._$Eu(t,e);s!==void 0&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(n){let t=[];if(Array.isArray(n)){let e=new Set(n.flat(1/0).reverse());for(let s of e)t.unshift($t(s))}else n!==void 0&&t.push($t(n));return t}static _$Eu(n,t){let e=t.attribute;return e===!1?void 0:typeof e=="string"?e:typeof n=="string"?n.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(n=>this.enableUpdating=n),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(n=>n(this))}addController(n){(this._$EO??=new Set).add(n),this.renderRoot!==void 0&&this.isConnected&&n.hostConnected?.()}removeController(n){this._$EO?.delete(n)}_$E_(){let n=new Map,t=this.constructor.elementProperties;for(let e of t.keys())this.hasOwnProperty(e)&&(n.set(e,this[e]),delete this[e]);n.size>0&&(this._$Ep=n)}createRenderRoot(){let n=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return jt(n,this.constructor.elementStyles),n}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(n=>n.hostConnected?.())}enableUpdating(n){}disconnectedCallback(){this._$EO?.forEach(n=>n.hostDisconnected?.())}attributeChangedCallback(n,t,e){this._$AK(n,e)}_$ET(n,t){let e=this.constructor.elementProperties.get(n),s=this.constructor._$Eu(n,e);if(s!==void 0&&e.reflect===!0){let i=(e.converter?.toAttribute!==void 0?e.converter:wt).toAttribute(t,e.type);this._$Em=n,i==null?this.removeAttribute(s):this.setAttribute(s,i),this._$Em=null}}_$AK(n,t){let e=this.constructor,s=e._$Eh.get(n);if(s!==void 0&&this._$Em!==s){let i=e.getPropertyOptions(s),a=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:wt;this._$Em=s;let l=a.fromAttribute(t,i.type);this[s]=l??this._$Ej?.get(s)??l,this._$Em=null}}requestUpdate(n,t,e,s=!1,i){if(n!==void 0){let a=this.constructor;if(s===!1&&(i=this[n]),e??=a.getPropertyOptions(n),!((e.hasChanged??Ft)(i,t)||e.useDefault&&e.reflect&&i===this._$Ej?.get(n)&&!this.hasAttribute(a._$Eu(n,e))))return;this.C(n,t,e)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(n,t,{useDefault:e,reflect:s,wrapped:i},a){e&&!(this._$Ej??=new Map).has(n)&&(this._$Ej.set(n,a??t??this[n]),i!==!0||a!==void 0)||(this._$AL.has(n)||(this.hasUpdated||e||(t=void 0),this._$AL.set(n,t)),s===!0&&this._$Em!==n&&(this._$Eq??=new Set).add(n))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let n=this.scheduleUpdate();return n!=null&&await n,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,i]of this._$Ep)this[s]=i;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[s,i]of e){let{wrapped:a}=i,l=this[s];a!==!0||this._$AL.has(s)||l===void 0||this.C(s,void 0,i,l)}}let n=!1,t=this._$AL;try{n=this.shouldUpdate(t),n?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(e){throw n=!1,this._$EM(),e}n&&this._$AE(t)}willUpdate(n){}_$AE(n){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(n)),this.updated(n)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(n){return!0}update(n){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(n){}firstUpdated(n){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[Z("elementProperties")]=new Map,C[Z("finalized")]=new Map,Re?.({ReactiveElement:C}),(rt.reactiveElementVersions??=[]).push("2.1.2");var kt=globalThis,Kt=r=>r,ot=kt.trustedTypes,qt=ot?ot.createPolicy("lit-html",{createHTML:r=>r}):void 0,At="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Et="?"+D,Me=`<${Et}>`,U=document,Q=()=>U.createComment(""),tt=r=>r===null||typeof r!="object"&&typeof r!="function",Tt=Array.isArray,Qt=r=>Tt(r)||typeof r?.[Symbol.iterator]=="function",xt=`[ 	
\f\r]`,J=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Gt=/-->/g,Yt=/>/g,z=RegExp(`>|${xt}(?:([^\\s"'>=/]+)(${xt}*=${xt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Xt=/'/g,Zt=/"/g,te=/^(?:script|style|textarea|title)$/i,St=r=>(n,...t)=>({_$litType$:r,strings:n,values:t}),h=St(1),ee=St(2),ts=St(3),R=Symbol.for("lit-noChange"),_=Symbol.for("lit-nothing"),Jt=new WeakMap,O=U.createTreeWalker(U,129);function se(r,n){if(!Tt(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return qt!==void 0?qt.createHTML(n):n}var ne=(r,n)=>{let t=r.length-1,e=[],s,i=n===2?"<svg>":n===3?"<math>":"",a=J;for(let l=0;l<t;l++){let o=r[l],d,p,c=-1,u=0;for(;u<o.length&&(a.lastIndex=u,p=a.exec(o),p!==null);)u=a.lastIndex,a===J?p[1]==="!--"?a=Gt:p[1]!==void 0?a=Yt:p[2]!==void 0?(te.test(p[2])&&(s=RegExp("</"+p[2],"g")),a=z):p[3]!==void 0&&(a=z):a===z?p[0]===">"?(a=s??J,c=-1):p[1]===void 0?c=-2:(c=a.lastIndex-p[2].length,d=p[1],a=p[3]===void 0?z:p[3]==='"'?Zt:Xt):a===Zt||a===Xt?a=z:a===Gt||a===Yt?a=J:(a=z,s=void 0);let f=a===z&&r[l+1].startsWith("/>")?" ":"";i+=a===J?o+Me:c>=0?(e.push(d),o.slice(0,c)+At+o.slice(c)+D+f):o+D+(c===-2?l:f)}return[se(r,i+(r[t]||"<?>")+(n===2?"</svg>":n===3?"</math>":"")),e]},et=class r{constructor({strings:n,_$litType$:t},e){let s;this.parts=[];let i=0,a=0,l=n.length-1,o=this.parts,[d,p]=ne(n,t);if(this.el=r.createElement(d,e),O.currentNode=this.el.content,t===2||t===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(s=O.nextNode())!==null&&o.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let c of s.getAttributeNames())if(c.endsWith(At)){let u=p[a++],f=s.getAttribute(c).split(D),y=/([.?@])?(.*)/.exec(u);o.push({type:1,index:i,name:y[2],strings:f,ctor:y[1]==="."?ct:y[1]==="?"?dt:y[1]==="@"?pt:W}),s.removeAttribute(c)}else c.startsWith(D)&&(o.push({type:6,index:i}),s.removeAttribute(c));if(te.test(s.tagName)){let c=s.textContent.split(D),u=c.length-1;if(u>0){s.textContent=ot?ot.emptyScript:"";for(let f=0;f<u;f++)s.append(c[f],Q()),O.nextNode(),o.push({type:2,index:++i});s.append(c[u],Q())}}}else if(s.nodeType===8)if(s.data===Et)o.push({type:2,index:i});else{let c=-1;for(;(c=s.data.indexOf(D,c+1))!==-1;)o.push({type:7,index:i}),c+=D.length-1}i++}}static createElement(n,t){let e=U.createElement("template");return e.innerHTML=n,e}};function N(r,n,t=r,e){if(n===R)return n;let s=e!==void 0?t._$Co?.[e]:t._$Cl,i=tt(n)?void 0:n._$litDirective$;return s?.constructor!==i&&(s?._$AO?.(!1),i===void 0?s=void 0:(s=new i(r),s._$AT(r,t,e)),e!==void 0?(t._$Co??=[])[e]=s:t._$Cl=s),s!==void 0&&(n=N(r,s._$AS(r,n.values),s,e)),n}var lt=class{constructor(n,t){this._$AV=[],this._$AN=void 0,this._$AD=n,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(n){let{el:{content:t},parts:e}=this._$AD,s=(n?.creationScope??U).importNode(t,!0);O.currentNode=s;let i=O.nextNode(),a=0,l=0,o=e[0];for(;o!==void 0;){if(a===o.index){let d;o.type===2?d=new F(i,i.nextSibling,this,n):o.type===1?d=new o.ctor(i,o.name,o.strings,this,n):o.type===6&&(d=new ht(i,this,n)),this._$AV.push(d),o=e[++l]}a!==o?.index&&(i=O.nextNode(),a++)}return O.currentNode=U,s}p(n){let t=0;for(let e of this._$AV)e!==void 0&&(e.strings!==void 0?(e._$AI(n,e,t),t+=e.strings.length-2):e._$AI(n[t])),t++}},F=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(n,t,e,s){this.type=2,this._$AH=_,this._$AN=void 0,this._$AA=n,this._$AB=t,this._$AM=e,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let n=this._$AA.parentNode,t=this._$AM;return t!==void 0&&n?.nodeType===11&&(n=t.parentNode),n}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(n,t=this){n=N(this,n,t),tt(n)?n===_||n==null||n===""?(this._$AH!==_&&this._$AR(),this._$AH=_):n!==this._$AH&&n!==R&&this._(n):n._$litType$!==void 0?this.$(n):n.nodeType!==void 0?this.T(n):Qt(n)?this.k(n):this._(n)}O(n){return this._$AA.parentNode.insertBefore(n,this._$AB)}T(n){this._$AH!==n&&(this._$AR(),this._$AH=this.O(n))}_(n){this._$AH!==_&&tt(this._$AH)?this._$AA.nextSibling.data=n:this.T(U.createTextNode(n)),this._$AH=n}$(n){let{values:t,_$litType$:e}=n,s=typeof e=="number"?this._$AC(n):(e.el===void 0&&(e.el=et.createElement(se(e.h,e.h[0]),this.options)),e);if(this._$AH?._$AD===s)this._$AH.p(t);else{let i=new lt(s,this),a=i.u(this.options);i.p(t),this.T(a),this._$AH=i}}_$AC(n){let t=Jt.get(n.strings);return t===void 0&&Jt.set(n.strings,t=new et(n)),t}k(n){Tt(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,e,s=0;for(let i of n)s===t.length?t.push(e=new r(this.O(Q()),this.O(Q()),this,this.options)):e=t[s],e._$AI(i),s++;s<t.length&&(this._$AR(e&&e._$AB.nextSibling,s),t.length=s)}_$AR(n=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);n!==this._$AB;){let e=Kt(n).nextSibling;Kt(n).remove(),n=e}}setConnected(n){this._$AM===void 0&&(this._$Cv=n,this._$AP?.(n))}},W=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(n,t,e,s,i){this.type=1,this._$AH=_,this._$AN=void 0,this.element=n,this.name=t,this._$AM=s,this.options=i,e.length>2||e[0]!==""||e[1]!==""?(this._$AH=Array(e.length-1).fill(new String),this.strings=e):this._$AH=_}_$AI(n,t=this,e,s){let i=this.strings,a=!1;if(i===void 0)n=N(this,n,t,0),a=!tt(n)||n!==this._$AH&&n!==R,a&&(this._$AH=n);else{let l=n,o,d;for(n=i[0],o=0;o<i.length-1;o++)d=N(this,l[e+o],t,o),d===R&&(d=this._$AH[o]),a||=!tt(d)||d!==this._$AH[o],d===_?n=_:n!==_&&(n+=(d??"")+i[o+1]),this._$AH[o]=d}a&&!s&&this.j(n)}j(n){n===_?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,n??"")}},ct=class extends W{constructor(){super(...arguments),this.type=3}j(n){this.element[this.name]=n===_?void 0:n}},dt=class extends W{constructor(){super(...arguments),this.type=4}j(n){this.element.toggleAttribute(this.name,!!n&&n!==_)}},pt=class extends W{constructor(n,t,e,s,i){super(n,t,e,s,i),this.type=5}_$AI(n,t=this){if((n=N(this,n,t,0)??_)===R)return;let e=this._$AH,s=n===_&&e!==_||n.capture!==e.capture||n.once!==e.once||n.passive!==e.passive,i=n!==_&&(e===_||s);s&&this.element.removeEventListener(this.name,this,e),i&&this.element.addEventListener(this.name,this,n),this._$AH=n}handleEvent(n){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,n):this._$AH.handleEvent(n)}},ht=class{constructor(n,t,e){this.element=n,this.type=6,this._$AN=void 0,this._$AM=t,this.options=e}get _$AU(){return this._$AM._$AU}_$AI(n){N(this,n)}},ie={M:At,P:D,A:Et,C:1,L:ne,R:lt,D:Qt,V:N,I:F,H:W,N:dt,U:pt,B:ct,F:ht},Le=kt.litHtmlPolyfillSupport;Le?.(et,F),(kt.litHtmlVersions??=[]).push("3.3.3");var ae=(r,n,t)=>{let e=t?.renderBefore??n,s=e._$litPart$;if(s===void 0){let i=t?.renderBefore??null;e._$litPart$=s=new F(n.insertBefore(Q(),i),i,void 0,t??{})}return s._$AI(r),s};var It=globalThis,T=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let n=super.createRenderRoot();return this.renderOptions.renderBefore??=n.firstChild,n}update(n){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(n),this._$Do=ae(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return R}};T._$litElement$=!0,T.finalized=!0,It.litElementHydrateSupport?.({LitElement:T});var Pe=It.litElementPolyfillSupport;Pe?.({LitElement:T});(It.litElementVersions??=[]).push("4.2.2");var re={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},oe=r=>(...n)=>({_$litDirective$:r,values:n}),ut=class{constructor(n){}get _$AU(){return this._$AM._$AU}_$AT(n,t,e){this._$Ct=n,this._$AM=t,this._$Ci=e}_$AS(n,t){return this.update(n,t)}update(n,t){return this.render(...t)}};var{I:He}=ie,le=r=>r;var ce=()=>document.createComment(""),K=(r,n,t)=>{let e=r._$AA.parentNode,s=n===void 0?r._$AB:n._$AA;if(t===void 0){let i=e.insertBefore(ce(),s),a=e.insertBefore(ce(),s);t=new He(i,a,r,r.options)}else{let i=t._$AB.nextSibling,a=t._$AM,l=a!==r;if(l){let o;t._$AQ?.(r),t._$AM=r,t._$AP!==void 0&&(o=r._$AU)!==a._$AU&&t._$AP(o)}if(i!==s||l){let o=t._$AA;for(;o!==i;){let d=le(o).nextSibling;le(e).insertBefore(o,s),o=d}}}return t},M=(r,n,t=r)=>(r._$AI(n,t),r),ze={},de=(r,n=ze)=>r._$AH=n,pe=r=>r._$AH,mt=r=>{r._$AR(),r._$AA.remove()};var he=(r,n,t)=>{let e=new Map;for(let s=n;s<=t;s++)e.set(r[s],s);return e},Ct=oe(class extends ut{constructor(r){if(super(r),r.type!==re.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,n,t){let e;t===void 0?t=n:n!==void 0&&(e=n);let s=[],i=[],a=0;for(let l of r)s[a]=e?e(l,a):a,i[a]=t(l,a),a++;return{values:i,keys:s}}render(r,n,t){return this.dt(r,n,t).values}update(r,[n,t,e]){let s=pe(r),{values:i,keys:a}=this.dt(n,t,e);if(!Array.isArray(s))return this.ut=a,i;let l=this.ut??=[],o=[],d,p,c=0,u=s.length-1,f=0,y=i.length-1;for(;c<=u&&f<=y;)if(s[c]===null)c++;else if(s[u]===null)u--;else if(l[c]===a[f])o[f]=M(s[c],i[f]),c++,f++;else if(l[u]===a[y])o[y]=M(s[u],i[y]),u--,y--;else if(l[c]===a[y])o[y]=M(s[c],i[y]),K(r,o[y+1],s[c]),c++,y--;else if(l[u]===a[f])o[f]=M(s[u],i[f]),K(r,s[c],s[u]),u--,f++;else if(d===void 0&&(d=he(a,f,y),p=he(l,c,u)),d.has(l[c]))if(d.has(l[u])){let m=p.get(a[f]),k=m!==void 0?s[m]:null;if(k===null){let A=K(r,s[c]);M(A,i[f]),o[f]=A}else o[f]=M(k,i[f]),K(r,s[c],k),s[m]=null;f++}else mt(s[u]),u--;else mt(s[c]),c++;for(;f<=y;){let m=K(r,o[y+1]);M(m,i[f]),o[f++]=m}for(;c<=u;){let m=s[c++];m!==null&&mt(m)}return this.ut=a,de(r,o),R}});var v={view:"glance",scope:"all",sort:"date",density:"comfortable",colors:"theme",max_items:5,days:7,range:"month"},ue=["#4C8BF5","#E0679A","#E3A23B","#3BA99C","#9A6FE0","#7BA23F","#D9776B","#5E6AD2"];function me(r,n,t={}){return n.map(e=>{let s=r.findIndex(a=>a.entry_id===e),i=r[s];return i?{entryId:e,name:i.name||i.username||i.title,color:t[e]??ue[s%ue.length]}:null}).filter(e=>e!==null)}function gt(r,n=new Date){try{return new Intl.DateTimeFormat("en-CA",{timeZone:r,year:"numeric",month:"2-digit",day:"2-digit"}).format(n)}catch{return new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit"}).format(n)}}function q(r){let[n,t,e]=r.split("-").map(Number);return new Date(Date.UTC(n??1970,(t??1)-1,e??1))}function ge(r){return r.toISOString().slice(0,10)}function w(r,n){let t=q(r);return t.setUTCDate(t.getUTCDate()+n),ge(t)}function G(r,n){let t=q(r.slice(0,7)+"-01");return t.setUTCMonth(t.getUTCMonth()+n),ge(t)}function Dt(r){return q(r).getUTCDay()}function Oe(r,n){return Math.round((q(n).getTime()-q(r).getTime())/864e5)}function b(r,n,t){return new Intl.DateTimeFormat(n,{...t,timeZone:"UTC"}).format(q(r))}function j(r,n,t){let e=Oe(n,r);if(e>=-1&&e<=1){let s=new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(e,"day");return s.charAt(0).toUpperCase()+s.slice(1)}return e>1&&e<7?b(r,t,{weekday:"long"}):b(r,t,{month:"short",day:"numeric",...r.slice(0,4)===n.slice(0,4)?{}:{year:"numeric"}})}function ft(r,n){let[t,e]=r.split(":").map(Number);return new Intl.DateTimeFormat(n,{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(2e3,0,1,t??0,e??0)))}function fe(r){let n=r.due?.at??null,t=n?"due":r.schedule?.start?"schedule":null,e=n??r.schedule?.start??null;return!e||!/^\d{4}-\d{2}-\d{2}/u.test(e)?{day:null,time:null,field:null}:{day:e.slice(0,10),time:e.length>=16?e.slice(11,16):null,field:t}}function _t(r,n,t){let{field:e}=fe(r);if(!n)return e?{[e]:null}:{};let s=t?`${n}T${t}`:n;return e==="due"?{due:{at:s,allDay:!t}}:{schedule:{start:s,end:null,allDay:!t}}}function Ue(r){let n=(l,o)=>l.task.title.localeCompare(o.task.title,void 0,{sensitivity:"base"}),t=(l,o)=>(l.day??"9999").localeCompare(o.day??"9999")||(l.time??"").localeCompare(o.time??""),e=(l,o)=>o.task.priority-l.task.priority,a=r==="priority"?[e,t,n]:r==="title"?[n,t]:r==="created"?[(l,o)=>(o.task.createdAt??"").localeCompare(l.task.createdAt??""),n]:r==="manual"?[(l,o)=>{let d=l.task.order??"\uFFFF",p=o.task.order??"\uFFFF";return d<p?-1:d>p?1:0},t,n]:[t,e,n];return(l,o)=>{if(l.open!==o.open)return l.open?-1:1;for(let d of a){let p=d(l,o);if(p)return p}return l.task.id.localeCompare(o.task.id)}}function Y(r,n,t=null){let e=new Map,s=new Set(n.lists??[]),i=(n.tags??[]).map(p=>p.toLowerCase()),a=n.scope??v.scope;for(let p of r){let c=new Map(p.lists.map(f=>[f.id,f])),u=`user:${p.account.user_id}`;for(let f of p.tasks){let y=c.get(f.listId??"")??null;if(!y||s.size&&!s.has(y.id)||a==="own"&&y.role!=="owner"||a==="assigned"&&!f.assignees.includes(u)||i.length&&!f.tags.some(L=>i.some(B=>L.toLowerCase()===B||L.toLowerCase().startsWith(B+"/"))))continue;let m=f.status==="open";if(!m&&!n.show_completed)continue;let k=p.account.can_write&&(y.role==="owner"||y.role==="editor"),A=e.get(f.id);if(A){A.seenBy.push(p.account.entry_id),!A.canWrite&&k&&(A.entryId=p.account.entry_id,A.canWrite=!0);continue}let{day:st,time:nt}=fe(f);e.set(f.id,{task:f,entryId:p.account.entry_id,seenBy:[p.account.entry_id],owners:[],others:[],list:y,day:st,time:nt,open:m,canWrite:k})}}let l=new Map(r.map(p=>[`user:${p.account.user_id}`,p.account.entry_id])),o=new Map(r.flatMap(p=>(p.people??[]).map(c=>[c.id,c.name])));for(let p of e.values()){let c=p.task.assignees.map(u=>l.get(u)).filter(u=>!!u);p.owners=c.length?c:p.seenBy,p.others=p.task.assignees.filter(u=>!l.has(u)).map(u=>o.get(u)).filter(u=>!!u)}return(t?[...e.values()].filter(p=>p.owners.includes(t)):[...e.values()]).sort(Ue(n.sort??v.sort))}function yt(r,n,t,e){let s=r.filter(c=>c.open),i=w(n,t),a=s.filter(c=>c.day!==null&&c.day<n),l=s.filter(c=>c.day===n),o=s.filter(c=>c.day!==null&&c.day>n&&c.day<=i),d=[...a,...l,...o],p=s.filter(c=>c.day===null);return{overdue:a,today:l,upcoming:o,next:[...d,...p].slice(0,Math.max(0,e))}}function _e(r,n){return r.filter(t=>t.open&&t.day!==null&&t.day<n)}function ye(r,n,t=7){return Array.from({length:t},(e,s)=>{let i=w(n,s);return{day:i,items:r.filter(a=>a.day===i)}})}var Rt=["glance","list","agenda","heatmap","calendar","week","next","board","shopping","tiles"];function Mt(r){let n=new Set(r.map(e=>e.task.id)),t=new Map;for(let e of r){let s=e.task.parentId;s&&n.has(s)&&t.set(s,[...t.get(s)??[],e])}return r.filter(e=>!(e.task.parentId&&n.has(e.task.parentId))).map(e=>({item:e,subtasks:t.get(e.task.id)??[]}))}function ve(r,n,t){let e=new Map(t.map(a=>[a.id,a.name])),s=[],i=new Set;for(let a of n){if(i.has(a.id))continue;i.add(a.id);let l=r.filter(p=>p.list?.id===a.id);if(!l.length)continue;let o=new Map;for(let p of l){let c=p.task.sectionId&&e.has(p.task.sectionId)?p.task.sectionId:"";o.set(c,[...o.get(c)??[],p])}let d=[...o.keys()].sort((p,c)=>p===""?-1:c===""?1:(e.get(p)??"").localeCompare(e.get(c)??""));for(let p of d)s.push({key:`${a.id}/${p}`,label:p?`${a.name} \xB7 ${e.get(p)}`:a.name,color:a.color,rows:Mt(o.get(p)??[])})}return s}function be(r,n,t,e){let s=[],i=r.filter(a=>a.open&&a.day!==null&&a.day<n);i.length&&s.push({key:"late",label:"Overdue",late:!0,rows:i.map(a=>({item:a,subtasks:[]}))});for(let a=0;a<=t;a++){let l=w(n,a),o=r.filter(c=>c.day===l).map(c=>({item:c,subtasks:[]}));if(!o.length&&a>0)continue;let d=j(l,n,e),p=b(l,e,{month:"short",day:"numeric"});s.push({key:l,label:a<2?`${d} \xB7 ${p}`:`${b(l,e,{weekday:"long"})} \xB7 ${p}`,rows:o})}return s}function Ne(r){return r<=0?0:r===1?1:r<=3?2:r<=5?3:4}function Lt(r,n,t,e){let s=new Map;for(let d of r)d.day&&s.set(d.day,(s.get(d.day)??0)+1);let i=n==="year"?`${t.slice(0,4)}-01-01`:`${t.slice(0,7)}-01`,a=n==="year"?`${t.slice(0,4)}-12-31`:w(G(i,1),-1),l=w(i,-((Dt(i)-e+7)%7)),o=[];for(;l<=a;){let d=[];for(let p=0;p<7;p++){let c=s.get(l)??0;d.push({day:l,count:c,level:Ne(c),inRange:l>=i&&l<=a}),l=w(l,1)}o.push(d)}return o}function $e(r,n,t,e,s=new Map){let i=new Map;for(let c of r){let u=s.get(c.task.id)??c.day;u&&i.set(u,[...i.get(u)??[],c])}let a=w(t,-((Dt(t)-e+7)%7)),l=n==="week"?a:`${t.slice(0,7)}-01`,o=n==="week"?w(a,6):w(G(l,1),-1),d=w(l,-((Dt(l)-e+7)%7)),p=[];for(;d<=o;){let c=[];for(let u=0;u<7;u++)c.push({day:d,inRange:d>=l&&d<=o,items:i.get(d)??[]}),d=w(d,1);p.push(c)}return p}function Pt(r,n){let e=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(r??"");if(e>=0)return e;try{let s=new Intl.Locale(n),i=s.getWeekInfo?.()??s.weekInfo;if(i)return i.firstDay%7}catch{}return 0}function we(r){let n=new Set;for(let t of r.split(/[,\s]+/u)){let e=t.replace(/^#/u,"").trim();e&&n.add(e)}return[...n]}var We={view:"View",title:"Title",entries:"People",scope:"Which tasks",lists:"Lists",tags:"Tags",sort:"Sort by",density:"Spacing",colors:"Colors",show_completed:"Show completed tasks",quick_add:"Show the add box",kiosk:"Wall tablet layout",max_items:"Tasks to list",days:"Days ahead",range:"Range",undated_tray:"Tray of undated tasks",height:"Height in pixels (0 grows to fit)",navigation_path:"Open on tap"},je={entries:"Leave empty to show the signed-in person their own tasks, or everyone when accounts are not matched to people.",scope:'"Their own lists" leaves out lists shared with them. "Assigned to them" shows only tasks they are assigned.',lists:"Leave empty for every list.",tags:"Leave empty for every tag. A tag also matches the tags under it.",kiosk:"Large touch targets, and adding goes through Assist voice instead of a keyboard.",undated_tray:"Drag a task without a date onto a day to give it that date. A button on the card hides or shows the tray."};function S(r,n,t=!1,e=!1){return{name:r,selector:{select:{options:n,multiple:t,custom_value:e,mode:t?"list":"dropdown"}}}}function Be(r,n,t,e){let s=r.view??v.view,i=(a,l,o)=>({name:a,selector:{number:{min:l,max:o,step:1,mode:"box"}}});return[S("view",[{value:"glance",label:"At a glance"},{value:"list",label:"List"},{value:"agenda",label:"Agenda"},{value:"heatmap",label:"Busy-day heatmap"},{value:"calendar",label:"Calendar"},{value:"week",label:"Week strip"},{value:"next",label:"Next up"},{value:"board",label:"Family board"},{value:"shopping",label:"Shopping list"},{value:"tiles",label:"Person tiles"}]),{name:"title",selector:{text:{}}},...s==="glance"?[i("max_items",0,50),i("days",1,60)]:[],...s==="agenda"?[i("days",1,60)]:[],...s==="tiles"?[{name:"navigation_path",selector:{navigation:{}}}]:[],...s==="heatmap"?[S("range",[{value:"month",label:"Month"},{value:"year",label:"Year"}])]:[],...s==="calendar"?[S("range",[{value:"month",label:"Month"},{value:"week",label:"Week"}]),{name:"undated_tray",selector:{boolean:{}}}]:[],...n.length>1?[S("entries",n,!0)]:[],S("scope",[{value:"all",label:"Everything they can see"},{value:"own",label:"Their own lists"},{value:"assigned",label:"Assigned to them"}]),...t.length?[S("lists",t,!0)]:[],...e.length?[S("tags",e,!0,!0)]:[],S("sort",[{value:"date",label:"Date"},{value:"priority",label:"Priority"},{value:"title",label:"Title"},{value:"created",label:"Newest first"},{value:"manual",label:"As in PeckList"}]),S("density",[{value:"comfortable",label:"Comfortable"},{value:"compact",label:"Compact"}]),S("colors",[{value:"theme",label:"Follow the Home Assistant theme"},{value:"pecklist",label:"PeckList colors (Forest)"}]),{name:"show_completed",selector:{boolean:{}}},{name:"quick_add",selector:{boolean:{}}},{name:"kiosk",selector:{boolean:{}}},i("height",0,2e3)]}function Ve(r){let n={type:r.type};for(let[t,e]of Object.entries(r))t==="type"||e===void 0||e===null||e===""||e===!1||Array.isArray(e)&&!e.length||t in v&&v[t]===e||t==="height"&&!e||(n[t]=e);return n}var Ht=class extends T{constructor(){super();this._loading=!1;this._accounts=null,this._snapshots=[]}static{this.properties={hass:{attribute:!1},_config:{state:!0},_accounts:{state:!0},_snapshots:{state:!0}}}setConfig(t){this._config=t}updated(){this.hass&&!this._accounts&&!this._loading&&this._load(this.hass)}async _load(t){this._loading=!0;try{let e=await t.callWS({type:"pecklist/accounts"}),s=[];for(let i of e.accounts)await new Promise(a=>{let l,o=!1,d=()=>{o=!0,l?.(),a()};t.connection.subscribeMessage(p=>{o||s.push(p),d()},{type:"pecklist/subscribe",entry_id:i.entry_id}).then(p=>{l=p,o&&p()},d)});this._snapshots=s,this._accounts=e}catch{this._accounts={version:0,accounts:[],mine:null}}}render(){if(!this.hass||!this._config)return _;let t=new Set(this._config.entries??[]),e=this._snapshots.filter(o=>!t.size||t.has(o.account.entry_id)),s=e.length>1,i=new Map,a=new Set;for(let o of e){for(let d of o.lists)i.has(d.id)||i.set(d.id,s&&!d.shared?`${d.name} (${o.account.username})`:d.name);for(let d of o.tags)a.add(d.name)}for(let o of this._config.lists??[])i.has(o)||i.set(o,o);for(let o of this._config.tags??[])a.add(o);let l=(this._accounts?.accounts??[]).map(o=>({value:o.entry_id,label:o.username||o.title}));return h`
			<ha-form
				.hass=${this.hass}
				.data=${{...v,...this._config}}
				.schema=${Be(this._config,l,[...i].map(([o,d])=>({value:o,label:d})),[...a].sort().map(o=>({value:o,label:o})))}
				.computeLabel=${o=>We[o.name]??o.name}
				.computeHelper=${o=>je[o.name]??""}
				@value-changed=${this._changed}
			></ha-form>
		`}_changed(t){t.stopPropagation();let e=Ve({...t.detail.value,type:this._config?.type??"custom:pecklist-card"});this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}};customElements.get("pecklist-card-editor")||customElements.define("pecklist-card-editor",Ht);var xe=bt`
	:host {
		--pl-accent: var(--primary-color, #5a8a4e);
		--pl-high: var(--error-color, #d9776b);
		--pl-medium: var(--warning-color, #e3b068);
		--pl-low: var(--info-color, #8daa9b);
		--pl-none: var(--secondary-text-color, #8a8f98);
		--pl-late: var(--error-color, #d9776b);
		--pl-text: var(--primary-text-color, #1b1d1f);
		--pl-muted: var(--secondary-text-color, #6b7078);
		--pl-line: var(--divider-color, rgba(127, 127, 127, 0.25));
		--pl-surface: var(--card-background-color, #fff);
		--pl-row: 8px;
		--pl-check: 22px;
		--pl-font: 14px;
		display: block;
		height: 100%;
	}
	:host([colors='pecklist']) {
		--pl-accent: #5a8a4e;
		--pl-high: #d9776b;
		--pl-medium: #e3b068;
		--pl-low: #8daa9b;
		--pl-none: #b8bcc4;
		--pl-late: #d9776b;
	}
	:host([density='compact']) {
		--pl-row: 3px;
		--pl-check: 18px;
		--pl-font: 13px;
	}
	:host([kiosk]) {
		--pl-row: 14px;
		--pl-check: 34px;
		--pl-font: 19px;
	}
	ha-card {
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--pl-text);
		font-size: var(--pl-font);
		overflow: hidden;
	}
	button {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0;
		margin: 0;
		cursor: pointer;
	}
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--pl-accent);
		outline-offset: 2px;
	}
	svg {
		width: 1.25em;
		height: 1.25em;
		fill: currentColor;
		flex: none;
	}

	header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 16px 6px;
	}
	h2 {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: 1.25em;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.state {
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	.people {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		padding: 10px 12px 6px;
	}
	header + .people {
		padding-top: 2px;
	}
	.chip {
		--who: var(--pl-accent);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 32px;
		padding: 0 12px;
		border: 1px solid var(--pl-line);
		border-radius: 999px;
		font-size: 0.9em;
		color: var(--pl-text);
		white-space: nowrap;
	}
	.chip b {
		font-weight: 500;
		color: var(--pl-muted);
	}
	.chip .dot {
		background: var(--who);
	}
	:host([kiosk]) .chip {
		min-height: 48px;
		padding: 0 18px;
	}
	.chip[aria-pressed='true'] {
		border-color: var(--who);
		background: color-mix(in srgb, var(--who) 18%, transparent);
		box-shadow: inset 0 0 0 1px var(--who);
	}
	.chip[aria-pressed='true'] b {
		color: inherit;
	}
	.people .grow {
		flex: 1;
	}
	.chip.plus {
		justify-content: center;
		width: 32px;
		padding: 0;
		color: var(--pl-muted);
	}
	:host([kiosk]) .chip.plus {
		width: 48px;
	}
	.chip.plus[aria-expanded='true'] {
		border-color: var(--pl-accent);
		color: var(--pl-accent);
	}
	.who {
		display: flex;
		flex-direction: column;
		align-self: stretch;
		width: 4px;
		margin: 1px -4px 1px 0;
		border-radius: 2px;
		overflow: hidden;
		flex: none;
	}
	.who i {
		flex: 1;
	}

	.add {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 4px 16px 8px;
		padding: 0 10px;
		border: 1px solid var(--pl-line);
		border-radius: 10px;
		color: var(--pl-muted);
	}
	.add[hidden],
	.add select[hidden] {
		display: none;
	}
	.add:focus-within {
		border-color: var(--pl-accent);
	}
	.add input {
		flex: 1;
		min-width: 0;
		padding: 9px 0;
		font: inherit;
		color: var(--pl-text);
		background: none;
		border: 0;
		outline: 0;
	}
	.add select {
		max-width: 40%;
		font: inherit;
		color: var(--pl-muted);
		background: none;
		border: 0;
	}
	.voice {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin: 6px 16px 10px;
		padding: 16px;
		border-radius: 16px;
		background: var(--pl-accent);
		color: var(--text-primary-color, #fff);
		font-size: 1.1em;
		font-weight: 500;
	}

	.body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0 8px 10px;
	}
	.empty,
	.problem {
		padding: 18px 8px;
		text-align: center;
		color: var(--pl-muted);
	}
	.problem {
		color: var(--pl-late);
	}

	.counts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		padding: 4px 8px 10px;
	}
	.count {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px 4px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--pl-accent) 10%, transparent);
	}
	.count[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--pl-accent);
	}
	.count b {
		font-size: 1.9em;
		font-weight: 500;
		line-height: 1.1;
	}
	.count span {
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	.count.late b {
		color: var(--pl-late);
	}
	.count.late.none b {
		color: inherit;
	}

	h3 {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 10px 8px 2px;
		font-size: 0.85em;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--pl-muted);
	}
	h3.late {
		color: var(--pl-late);
	}
	.dot {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
		background: var(--pl-accent);
		flex: none;
	}
	.none-today {
		padding: 2px 8px 6px;
		color: var(--pl-muted);
		font-size: 0.9em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	ul ul {
		margin-left: calc(var(--pl-check) + 10px);
	}
	.row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: var(--pl-row) 8px;
		border-radius: 8px;
	}
	.row:hover {
		background: color-mix(in srgb, var(--pl-text) 5%, transparent);
	}
	.row.leaving {
		opacity: 0.5;
	}
	.check {
		display: grid;
		place-items: center;
		width: var(--pl-check);
		height: var(--pl-check);
		margin-top: 1px;
		border: 2px solid var(--pl-none);
		border-radius: 50%;
		flex: none;
		color: transparent;
	}
	.check.p1 {
		border-color: var(--pl-low);
	}
	.check.p2 {
		border-color: var(--pl-medium);
	}
	.check.p3 {
		border-color: var(--pl-high);
	}
	.check svg {
		width: 70%;
		height: 70%;
	}
	.check.closed {
		background: var(--pl-none);
		border-color: var(--pl-none);
		color: var(--pl-surface);
	}
	.check:disabled {
		cursor: default;
		opacity: 0.6;
	}
	.what {
		flex: 1;
		min-width: 0;
		text-align: left;
	}
	.what:disabled {
		cursor: default;
	}
	.name {
		display: block;
		overflow-wrap: anywhere;
	}
	.closed + .what .name {
		color: var(--pl-muted);
		text-decoration: line-through;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px 10px;
		margin-top: 1px;
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	.meta .late {
		color: var(--pl-late);
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.meta svg {
		width: 1em;
		height: 1em;
	}

	/* Dense rows: one line each, the date at the right, so a section cell shows more tasks. */
	:host([density='compact']) .what {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	:host([density='compact']) .name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:host([density='compact']) .meta {
		flex: none;
		flex-wrap: nowrap;
		margin: 0;
	}
	:host([density='compact']) .meta .tag {
		display: none;
	}
	:host([density='compact']) .counts {
		gap: 6px;
		padding-bottom: 6px;
	}
	:host([density='compact']) .count {
		flex-direction: row;
		justify-content: center;
		align-items: baseline;
		gap: 6px;
		padding: 5px 4px;
	}
	:host([density='compact']) .count b {
		font-size: 1.3em;
	}
	:host([density='compact']) h3 {
		margin-top: 6px;
	}
	.groups section {
		break-inside: avoid;
	}
	/* A narrow cell (a third of a phone, a small section): the list's name gives way to the task. */
	@container (max-width: 330px) {
		:host([density='compact']) .meta .in {
			display: none;
		}
		header {
			padding: 10px 12px 4px;
		}
	}
	/* A wide cell (a card across two or three sections): groups side by side. */
	@container (min-width: 680px) {
		.groups {
			columns: 2;
			column-gap: 16px;
		}
	}
	@container (min-width: 1040px) {
		.groups {
			columns: 3;
		}
	}

	/* Week strip */
	.week {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		padding: 2px 8px 6px;
	}
	.wday {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		min-width: 0;
		padding: 6px 0 5px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--pl-text) 5%, transparent);
	}
	.wday .wd {
		color: var(--pl-muted);
		font-size: 0.75em;
	}
	.wday b {
		font-size: 1.15em;
		font-weight: 500;
	}
	.wday.today b {
		color: var(--pl-accent);
	}
	.wday[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--pl-accent);
	}
	.dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		height: 8px;
	}
	.dots i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.dots em {
		font-style: normal;
		font-size: 0.65em;
		color: var(--pl-muted);
	}
	:host([kiosk]) .wday {
		padding: 12px 0 10px;
	}

	/* Next up */
	.hero {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 8px 6px;
	}
	.hero-when {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 12px;
		color: var(--pl-muted);
		font-size: 0.9em;
	}
	.hero-when span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.hero-when .late,
	.tile .late {
		color: var(--pl-late);
	}
	.hero-title {
		font-size: 1.5em;
		font-weight: 500;
		line-height: 1.2;
		text-align: left;
		overflow-wrap: anywhere;
	}
	.hero-title.done {
		color: var(--pl-muted);
		font-size: 1.15em;
	}
	.hero-actions {
		display: flex;
		gap: 8px;
		margin-top: 2px;
	}
	.hero-actions .btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 1;
		min-height: 44px;
		border: 1px solid var(--pl-line);
	}
	.hero-actions .btn.primary {
		flex: 2;
		border-color: var(--pl-accent);
	}
	.hero-more {
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	:host([kiosk]) .hero-title {
		font-size: 1.8em;
	}
	:host([kiosk]) .hero-actions .btn {
		min-height: 64px;
	}

	/* Family board */
	.board {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(170px, 1fr);
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 4px;
	}
	.col {
		min-width: 0;
		border-top: 3px solid var(--who);
		border-radius: 4px 4px 0 0;
	}
	/* A column is narrow: the title gets the line, the date goes under it, whatever the spacing. */
	:host([density='compact']) .col .what {
		display: block;
	}
	:host([density='compact']) .col .name {
		white-space: normal;
	}
	.col .meta .tag {
		display: none;
	}
	.col h3 {
		color: var(--pl-text);
		font-size: 0.95em;
		margin-top: 8px;
	}
	.col h3 .dot {
		background: var(--who);
	}
	.col h3 b {
		font-weight: 500;
		color: var(--pl-muted);
	}

	/* Shopping list */
	:host([view='shopping']) {
		--pl-check: 26px;
		--pl-row: 9px;
	}
	:host([view='shopping']) .name {
		font-size: 1.1em;
	}
	:host([view='shopping']) .meta {
		display: none;
	}
	h3 .grow {
		flex: 1;
	}
	.clear {
		padding: 4px 12px;
		border: 1px solid var(--pl-line);
		border-radius: 999px;
		color: var(--pl-text);
		font-weight: 500;
	}

	/* Person tiles */
	:host([view='tiles']) .body {
		padding: 0;
		overflow: hidden;
	}
	.tiles {
		display: flex;
		height: 100%;
		min-height: 52px;
	}
	.tile {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		align-items: center;
		align-content: center;
		column-gap: 10px;
		flex: 1;
		min-width: 0;
		padding: 6px 14px;
		text-align: left;
		border-left: 1px solid var(--pl-line);
	}
	.tile:first-child {
		border-left: 0;
	}
	.tile:disabled {
		cursor: default;
	}
	.tile .dot {
		grid-row: 1 / 3;
		width: 12px;
		height: 12px;
		background: var(--who);
	}
	.tile-name {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tile-counts {
		color: var(--pl-muted);
		font-size: 0.85em;
		white-space: nowrap;
	}
	.tile-counts b {
		font-weight: 600;
		color: var(--pl-text);
	}
	.tile-counts b.late {
		color: var(--pl-late);
		margin-left: 6px;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 6px;
	}
	.nav strong {
		flex: 1;
		font-weight: 500;
	}
	.nav button {
		display: grid;
		place-items: center;
		width: 2.2em;
		height: 2.2em;
		border-radius: 50%;
	}
	.nav button:hover {
		background: color-mix(in srgb, var(--pl-text) 8%, transparent);
	}
	.heat {
		display: grid;
		gap: 3px;
		padding: 0 8px 8px;
	}
	.heat {
		grid-template-columns: repeat(7, 1fr);
	}
	.year {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 12px 14px;
		padding: 0 8px 8px;
	}
	.month-name {
		margin-bottom: 3px;
		color: var(--pl-muted);
		font-size: 0.8em;
	}
	.heat.small {
		gap: 2px;
		padding: 0;
	}
	.heat .wd {
		text-align: center;
		color: var(--pl-muted);
		font-size: 0.75em;
	}
	.cell {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		min-width: 0;
		border-radius: 6px;
		background: color-mix(in srgb, var(--pl-accent) calc(var(--level) * 22%), color-mix(in srgb, var(--pl-text) 6%, transparent));
		font-size: 0.85em;
	}
	.heat.small .cell {
		border-radius: 3px;
		font-size: 0;
	}
	:host([kiosk]) .heat.small .cell {
		border-radius: 5px;
	}
	.cell.l3,
	.cell.l4 {
		color: var(--text-primary-color, #fff);
	}
	.cell.out {
		visibility: hidden;
	}
	.cell.today {
		box-shadow: inset 0 0 0 2px var(--pl-text);
	}
	.cell[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--pl-accent), 0 0 0 1px var(--pl-accent);
	}
	.legend {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 3px;
		padding: 0 8px 4px;
		color: var(--pl-muted);
		font-size: 0.75em;
	}
	.legend i {
		width: 1em;
		height: 1em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--pl-accent) calc(var(--level) * 22%), color-mix(in srgb, var(--pl-text) 6%, transparent));
	}

	/* Calendar */
	.seg {
		display: flex;
		margin-right: 4px;
		border: 1px solid var(--pl-line);
		border-radius: 999px;
		overflow: hidden;
	}
	.nav .seg button {
		width: auto;
		height: 2em;
		padding: 0 10px;
		border-radius: 0;
		font-size: 0.85em;
		color: var(--pl-muted);
	}
	.nav .seg button[aria-pressed='true'] {
		background: color-mix(in srgb, var(--pl-accent) 15%, transparent);
		color: var(--pl-text);
	}
	.cal {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 3px;
		padding: 0 8px 8px;
	}
	.cal .wd {
		text-align: center;
		color: var(--pl-muted);
		font-size: 0.75em;
	}
	.cday {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		min-height: 4.6em;
		padding: 2px 2px 3px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--pl-text) 4%, transparent);
		cursor: pointer;
	}
	.cal.week .cday {
		min-height: 11em;
	}
	.cday.out {
		opacity: 0.5;
	}
	.cday[aria-current='date'] {
		box-shadow: inset 0 0 0 2px var(--pl-accent);
	}
	.cday.drop {
		background: color-mix(in srgb, var(--pl-accent) 22%, transparent);
		box-shadow: inset 0 0 0 2px var(--pl-accent);
	}
	.dnum {
		align-self: flex-start;
		min-width: 1.7em;
		padding: 1px 3px;
		border-radius: 999px;
		font-size: 0.8em;
		text-align: center;
	}
	.cday.today .dnum {
		background: var(--pl-accent);
		color: var(--text-primary-color, #fff);
	}
	.ctask {
		display: flex;
		gap: 3px;
		min-width: 0;
		padding: 1px 4px;
		border-left: 3px solid var(--c);
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 16%, transparent);
		font-size: 0.75em;
		line-height: 1.35;
		text-align: left;
		white-space: nowrap;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
	}
	.ctask span {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ctask b {
		flex: none;
		font-weight: 500;
		color: var(--pl-muted);
	}
	.ctask.movable {
		cursor: grab;
	}
	.ctask.closed span {
		text-decoration: line-through;
		color: var(--pl-muted);
	}
	.ctask.lifted {
		opacity: 0.45;
		cursor: grabbing;
	}
	.cal.week .ctask {
		flex-direction: column;
		gap: 0;
		white-space: normal;
	}
	.cal.week .ctask span {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow-wrap: anywhere;
	}
	/* A narrow week: one line a task, cut short, and the time left to the day's list below. */
	@container (max-width: 480px) {
		.cal.week .ctask {
			white-space: nowrap;
		}
		.cal.week .ctask b {
			display: none;
		}
		.cal.week .ctask span {
			display: block;
			overflow-wrap: normal;
		}
	}
	.cday .more {
		padding: 0 4px;
		color: var(--pl-muted);
		font-size: 0.72em;
	}
	:host([kiosk]) .ctask {
		padding: 4px 6px;
		font-size: 0.85em;
	}
	.nav .tray-toggle[aria-pressed='true'] {
		color: var(--pl-accent);
		background: color-mix(in srgb, var(--pl-accent) 15%, transparent);
	}
	/* The undated tray: under the calendar on a narrow card, beside it on a wide one. */
	.tray {
		margin: 0 8px 8px;
		padding: 4px 6px 6px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--pl-text) 4%, transparent);
	}
	.tray h4 {
		margin: 0 0 4px;
		font-size: 0.8em;
		font-weight: 500;
		color: var(--pl-muted);
	}
	.tray h4 span {
		margin-left: 4px;
	}
	.tray-tasks {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		max-height: 7.5em;
		overflow-y: auto;
	}
	.tray .ctask {
		max-width: 100%;
	}
	.tray-none {
		margin: 0;
		color: var(--pl-muted);
		font-size: 0.8em;
	}
	@container (min-width: 680px) {
		.calwrap.with-tray {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(9em, 22%);
			align-items: start;
		}
		.calwrap.with-tray .cal {
			padding-right: 0;
		}
		.calwrap.with-tray .tray {
			margin-left: 6px;
			max-height: 100%;
		}
		.calwrap.with-tray .tray-tasks {
			flex-direction: column;
			flex-wrap: nowrap;
			max-height: 28em;
		}
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 8;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgba(0, 0, 0, 0.45);
	}
	.scrim form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: min(440px, 100%);
		max-height: 100%;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 18px;
		border-radius: 16px;
		background: var(--pl-surface);
		color: var(--pl-text);
		font-size: 14px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
		container: dialog / inline-size;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	.scrim input,
	.scrim textarea,
	.scrim select {
		padding: 9px 10px;
		border: 1px solid var(--pl-line);
		border-radius: 8px;
		font: inherit;
		font-size: 14px;
		color: var(--pl-text);
		background: none;
		color-scheme: light dark;
	}
	.scrim textarea {
		min-height: 4.5em;
		resize: vertical;
	}
	.two {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 10px;
	}
	.scrim input,
	.scrim select,
	.scrim textarea {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
	}
	/* A phone's native date and time controls will not shrink: one under the other there. */
	@container dialog (max-width: 400px) {
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.prio {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.prio button {
		padding: 7px 0;
		border: 1px solid var(--pl-line);
		border-radius: 8px;
		color: var(--pl-text);
	}
	.prio button[aria-pressed='true'] {
		border-color: var(--pl-accent);
		box-shadow: inset 0 0 0 1px var(--pl-accent);
	}
	.subs li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 0;
	}
	.subs .check {
		margin-top: 0;
	}
	.subs input {
		flex: 1;
		min-width: 0;
		padding: 5px 8px;
		border-color: transparent;
	}
	.subs input:hover,
	.subs input:focus {
		border-color: var(--pl-line);
	}
	.subs input.closed {
		color: var(--pl-muted);
		text-decoration: line-through;
	}
	.subs .remove {
		display: grid;
		place-items: center;
		width: 2em;
		height: 2em;
		border-radius: 50%;
		color: var(--pl-muted);
	}
	.subs .remove:hover {
		background: color-mix(in srgb, var(--pl-text) 8%, transparent);
	}
	.note {
		margin-top: -6px;
		color: var(--pl-muted);
		font-size: 0.85em;
	}
	.assign {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}
	.actions .grow {
		flex: 1;
	}
	.btn {
		padding: 9px 16px;
		border-radius: 8px;
		font-weight: 500;
	}
	.btn.primary {
		background: var(--pl-accent);
		color: var(--text-primary-color, #fff);
	}
	.btn.danger {
		color: var(--pl-late);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.error {
		color: var(--pl-late);
		font-size: 0.9em;
	}
`,$={check:"M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",plus:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",mic:"M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3m5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z",left:"M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",right:"M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",repeat:"M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z",today:"M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V9h14zM7 11h5v5H7z",close:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",tray:"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 12h-4a3 3 0 0 1-6 0H5V5h14z"};var ke="pecklist-card:undated-tray";function Fe(){try{return localStorage.getItem(ke)!=="0"}catch{return!0}}var Ke=["None","Low","Medium","High"],qe=350,Ge=5,Ye=8;function x(r){return h`<svg viewBox="0 0 24 24" aria-hidden="true">${ee`<path d=${r}></path>`}</svg>`}function I(r){return r&&typeof r=="object"&&"message"in r?String(r.message):String(r)}var zt=class extends T{constructor(){super();this._drag=null;this._swallowClick=!1;this._focusTask=null;this._focusKind="ctask";this._focusHeld=!1;this._placed=null;this._opener=null;this._unsubscribe=[];this._generation=0;this._wanted="";this._onDragMove=t=>{let e=this._drag;if(!(!e||t.pointerId!==e.pointer)){if(!e.active){let s=Math.hypot(t.clientX-e.x,t.clientY-e.y);if(e.touch){s>Ye&&this._endDrag();return}if(s<Ge)return;this._lift(e)}this._dropDay=this._overTray(t.clientX,t.clientY)?null:this._dayAt(t.clientX,t.clientY)??this._dropDay}};this._onDragEnd=t=>{let e=this._drag;if(!e||t.pointerId!==e.pointer)return;let s=e.active&&!this._overTray(t.clientX,t.clientY)?this._dayAt(t.clientX,t.clientY)??this._dropDay:null;if(this._endDrag(),!e.active)return;this._swallowClick=!0,setTimeout(()=>this._swallowClick=!1,0);let{item:i}=e;s&&s!==(this._moves.get(i.task.id)??i.day)&&this._moveTo(i,s)};this._touchMove={handleEvent:t=>{this._drag?.active&&t.cancelable&&t.preventDefault()},passive:!1};this._endDrag=()=>{window.removeEventListener("pointermove",this._onDragMove,!0),window.removeEventListener("pointerup",this._onDragEnd,!0),window.removeEventListener("pointercancel",this._endDrag,!0),this._drag&&clearTimeout(this._drag.hold),this._drag=null,this._dragId=null,this._dropDay=null};this._toggleTray=()=>{this._trayShown=!this._trayShown;try{localStorage.setItem(ke,this._trayShown?"1":"0")}catch{}};this._config={type:"custom:pecklist-card"},this._accounts=null,this._snapshots=new Map,this._problem="",this._person=null,this._pending=new Set,this._leaving=new Set,this._draft=null,this._anchor=null,this._selected=null,this._filter=null,this._adding=!1,this._addOpen=!1,this._addError="",this._today=gt(void 0),this._range=null,this._moves=new Map,this._dragId=null,this._dropDay=null,this._trayShown=Fe()}static{this.styles=xe}static{this.properties={_config:{state:!0},_accounts:{state:!0},_snapshots:{state:!0},_problem:{state:!0},_person:{state:!0},_pending:{state:!0},_leaving:{state:!0},_draft:{state:!0},_anchor:{state:!0},_selected:{state:!0},_filter:{state:!0},_adding:{state:!0},_addOpen:{state:!0},_addError:{state:!0},_today:{state:!0},_range:{state:!0},_moves:{state:!0},_dragId:{state:!0},_dropDay:{state:!0},_trayShown:{state:!0}}}static getConfigElement(){return document.createElement("pecklist-card-editor")}static getStubConfig(){return{type:"custom:pecklist-card",view:"glance",quick_add:!0}}setConfig(t){if(!t||typeof t!="object")throw new Error("Invalid configuration");if(t.view&&!Rt.includes(t.view))throw new Error(`Unknown view "${t.view}": use ${Rt.join(", ")}`);this.setAttribute("view",t.view??v.view),this._config=t,this.toggleAttribute("kiosk",!!t.kiosk),this.setAttribute("density",t.density??v.density),this.setAttribute("colors",t.colors??v.colors),this._filter=null,this._connect()}set hass(t){let e=!this._hass;this._hass=t;let s=gt(t.config?.time_zone);s!==this._today&&(this._today=s),e&&this._connect()}getCardSize(){let t=this._config.view;return t==="heatmap"?7:t==="calendar"?8:t==="tiles"?1:t==="next"?3:5}getGridOptions(){let t=this._config.view;return t==="tiles"?{columns:12,min_columns:3,rows:1,min_rows:1}:t==="next"?{columns:12,min_columns:6,rows:3,min_rows:2}:t==="week"?{columns:12,min_columns:9,rows:4,min_rows:2}:t==="calendar"?{columns:12,min_columns:6,rows:8,min_rows:4}:{columns:12,min_columns:6,rows:this._config.height?Math.ceil(this._config.height/56)+1:6,min_rows:3}}connectedCallback(){super.connectedCallback(),this._connect(),this._clock=setInterval(()=>{let t=gt(this._hass?.config?.time_zone);t!==this._today&&(this._today=t)},6e4)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._clock),this._endDrag(),this._drop()}_drop(){this._generation++,this._wanted="";for(let t of this._unsubscribe)t();this._unsubscribe=[]}async _connect(){let t=this._hass;if(!t||!this.isConnected)return;try{this._accounts??=await t.callWS({type:"pecklist/accounts"})}catch(o){this._problem=o?.code==="unknown_command"?"The PeckList integration is not set up. Add it under Settings > Devices & services.":`PeckList: ${I(o)}`;return}let e=this._accounts.accounts,s=(this._config.entries??[]).filter(o=>e.some(d=>d.entry_id===o)),i=s.length?s:this._accounts.mine?[this._accounts.mine]:e.map(o=>o.entry_id),a=i.join(",");if(a===this._wanted)return;this._drop(),this._wanted=a;let l=this._generation;this._problem=e.length?"":"No PeckList account is connected. Add one under Settings > Devices & services.",this._snapshots=new Map([...this._snapshots].filter(([o])=>i.includes(o)));for(let o of i)try{let d=await t.connection.subscribeMessage(p=>{l===this._generation&&(this._snapshots=new Map(this._snapshots).set(o,p),this._pending.size&&(this._pending=new Set),this._moves.size&&(this._moves=new Map))},{type:"pecklist/subscribe",entry_id:o});l===this._generation?this._unsubscribe.push(d):d()}catch(d){l===this._generation&&(this._problem=`PeckList: ${I(d)}`)}}get _language(){return this._hass?.locale?.language??this._hass?.language??"en"}_shown(){return this._wanted.split(",").map(t=>this._snapshots.get(t)).filter(t=>!!t)}_people(){let t=this._wanted.split(",").filter(e=>this._snapshots.has(e));return me(this._accounts?.accounts??[],t,this._config.person_colors)}async _send(t,e,s){if(!this._hass)throw new Error("Not connected");return this._hass.callWS({type:`pecklist/task/${t}`,entry_id:e.entryId,...s})}async _toggle(t){if(!(!t.canWrite||this._pending.has(t.task.id))){this._pending=new Set(this._pending).add(t.task.id);try{await this._send(t.open?"complete":"reopen",t,{task_id:t.task.id})}catch(e){this._pending=new Set([...this._pending].filter(s=>s!==t.task.id)),this._problem=I(e),setTimeout(()=>this._problem="",6e3)}}}async _add(t){t.preventDefault();let e=t.currentTarget,s=e.querySelector("input"),i=s.value.trim(),a=e.querySelector("select")?.value??this._addTargets()[0]?.value;if(!i||!a||this._adding)return;let[l,o]=a.split("/");this._adding=!0,this._addError="";try{await this._send("quick_add",{entryId:l??""},{text:i,...o?{list_id:o}:{}}),s.value=""}catch(d){this._addError=I(d)}finally{this._adding=!1,s.focus()}}_addTargets(){let t=new Set(this._config.lists??[]),e=this._shown().filter(i=>i.account.can_write&&(!this._person||i.account.entry_id===this._person)),s=[];for(let i of e){let a=e.length>1?`${i.account.username}: `:"",l=i.lists.filter(o=>(!t.size||t.has(o.id))&&(o.role==="owner"||o.role==="editor"));!t.size&&i.lists.some(o=>o.isInbox)&&s.push({value:`${i.account.entry_id}/`,label:`${a}Default list`});for(let o of l)s.push({value:`${i.account.entry_id}/${o.id}`,label:a+o.name})}return s}_assist(){this.dispatchEvent(new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:{tap_action:{action:"assist",start_listening:!0}},action:"tap"}}))}_edit(t){if(!t.canWrite)return;this._opener=this.renderRoot.activeElement??null;let e=t.task.parentId?[]:this._moveTargets(t);this._draft={item:t,title:t.task.title,day:t.day??"",time:t.time??"",priority:t.task.priority,tags:t.task.tags.join(", "),notes:t.task.notes??"",assignees:t.list?.shared&&this._assignable(t).length>1?[...t.task.assignees]:null,listId:e.length>1&&e.some(s=>s.id===t.task.listId)?t.task.listId:null,saving:!1,error:"",note:""},this.updateComplete.then(()=>this.renderRoot.querySelector(".scrim form")?.focus())}_assignable(t){return(this._snapshots.get(t.entryId)?.people??[]).filter(e=>e.assignable)}_moveTargets(t){return(this._snapshots.get(t.entryId)?.lists??[]).filter(e=>e.role==="owner"||e.role==="editor")}_children(t){let e=s=>s.order??"\uFFFF";return(this._snapshots.get(t.entryId)?.tasks??[]).filter(s=>s.parentId===t.task.id).sort((s,i)=>+(s.status!=="open")-+(i.status!=="open")||(e(s)<e(i)?-1:e(s)>e(i)?1:0)||(s.createdAt??"").localeCompare(i.createdAt??""))}async _subtask(t,e,s,i=""){let a=this._draft;if(a){s&&(this._pending=new Set(this._pending).add(s)),this._set({error:"",note:""});try{await this._send(t,a.item,e),i&&this._set({note:i})}catch(l){s&&(this._pending=new Set([...this._pending].filter(o=>o!==s))),this._set({error:I(l)})}}}_addSubtask(t){if(t.key!=="Enter"||t.isComposing)return;t.preventDefault();let e=this._draft,s=t.target,i=s.value.trim();if(!e||!i)return;s.value="";let{task:a}=e.item;this._subtask("create",{task:{title:i,parentId:a.id,...a.listId?{listId:a.listId}:{}}})}_renameSubtask(t,e){let s=t.target,i=s.value.trim();if(!i){s.value=e.title;return}i!==e.title&&this._subtask("update",{task_id:e.id,changes:{title:i}})}_set(t){this._draft&&(this._draft={...this._draft,...t})}async _save(t){t.preventDefault();let e=this._draft;if(!e||e.saving)return;let{task:s}=e.item,i={},a=e.title.trim();if(!a)return this._set({error:"A task needs a title."});a!==s.title&&(i.title=a),e.notes!==(s.notes??"")&&(i.notes=e.notes),e.priority!==s.priority&&(i.priority=e.priority);let l=we(e.tags);l.join(`
`)!==s.tags.join(`
`)&&(i.tags=l),e.assignees&&[...e.assignees].sort().join()!==[...s.assignees].sort().join()&&(i.assignees=e.assignees),e.listId&&e.listId!==s.listId&&(i.listId=e.listId);let o=e.day?e.time:"";if((e.day!==(e.item.day??"")||o!==(e.item.time??""))&&Object.assign(i,_t(s,e.day||null,o||null)),!Object.keys(i).length){this._closeDialog();return}this._set({saving:!0,error:""});try{await this._send("update",e.item,{task_id:s.id,changes:i}),this._closeDialog()}catch(d){this._set({saving:!1,error:I(d)})}}async _delete(){let t=this._draft;if(!(!t||t.saving)){this._set({saving:!0,error:""});try{await this._send("delete",t.item,{task_id:t.item.task.id}),this._closeDialog()}catch(e){this._set({saving:!1,error:I(e)})}}}render(){let t=this._config,e=t.view??v.view,s=this._people(),i=this._shown(),a=!this._problem&&!!this._wanted&&this._snapshots.size===0,l=i.some(y=>!y.connected),o=s.some(y=>y.entryId===this._person)?this._person:null,d=s.length>1?Y(i,t):[],p=Y(i,t,o),c=y=>d.filter(m=>m.open&&m.owners.includes(y)).length,u=!!t.quick_add&&!t.kiosk&&(t.density??v.density)==="compact"&&this._addTargets().length>0,f=t.height?`max-height:${t.height}px`:"";return h`
			<ha-card>
				${t.title||l?h`<header>
							<h2>${t.title??""}</h2>
							${l?h`<span class="state">Server unreachable</span>`:_}
						</header>`:_}
				${s.length>1&&e!=="board"&&e!=="tiles"||u&&e!=="tiles"?h`<div class="people" role="group" aria-label=${s.length>1?"People":"Actions"}>
							${s.length>1?h`<button class="chip" aria-pressed=${o===null} @click=${()=>this._person=null}>
										All <b>${d.filter(y=>y.open).length}</b>
									</button>`:_}
							${(s.length>1?s:[]).map(y=>h`<button
										class="chip"
										style="--who:${y.color}"
										aria-pressed=${o===y.entryId}
										@click=${()=>this._person=o===y.entryId?null:y.entryId}
									>
										<i class="dot"></i>${y.name} <b>${c(y.entryId)}</b>
									</button>`)}
							${u?h`<span class="grow"></span
										><button
											class="chip plus"
											aria-label="Add a task"
											title="Add a task"
											aria-expanded=${this._addOpen}
											@click=${this._toggleAdd}
										>
											${x($.plus)}
										</button>`:_}
						</div>`:_}
				${e==="tiles"?_:this._renderAdd(u&&!this._addOpen)}
				<div class="body" style=${f}>
					${this._problem?h`<div class="problem" role="alert">${this._problem}</div>`:_}
					${a?h`<div class="empty">Loading…</div>`:this._renderView(e,p,i,o)}
				</div>
				${this._draft?this._renderDialog(this._draft):_}
			</ha-card>
		`}async _toggleAdd(){this._addOpen=!this._addOpen,this._addError="",await this.updateComplete,this._addOpen&&this.renderRoot.querySelector(".add input")?.focus()}_renderAdd(t=!1){if(!this._config.quick_add)return _;let e=this._addTargets();return e.length?this._config.kiosk?h`<button class="voice" @click=${this._assist}>${x($.mic)} Add a task</button>`:h`
			<form class="add" ?hidden=${t} @submit=${this._add}>
				${x($.plus)}
				<input
					type="text"
					maxlength="1000"
					enterkeyhint="done"
					aria-label="Add a task"
					placeholder="Add a task: tomorrow 9am #tag !high"
					?disabled=${this._adding}
				/>
				<select aria-label="List" ?hidden=${e.length<2}>
					${e.map(s=>h`<option value=${s.value}>${s.label}</option>`)}
				</select>
			</form>
			${this._addError?h`<div class="problem" role="alert">${this._addError}</div>`:_}
		`:_}_renderView(t,e,s,i){let a=this._config;switch(t){case"list":return this._renderList(e,s);case"agenda":return this._renderGroups(be(e,this._today,a.days??v.days,this._language),!0,!1);case"heatmap":return this._renderHeatmap(e);case"calendar":return this._renderCalendar(e);case"week":return this._renderWeek(e);case"next":return this._renderNext(e);case"board":return this._renderBoard(s);case"shopping":return this._renderShopping(s,i);case"tiles":return this._renderTiles(s);default:return this._renderGlance(e)}}_renderWeek(t){let e=this._language,s=this._today,i=ye(t,s,7),a=i.some(c=>c.day===this._selected)?this._selected:s,l=this._person?[]:this._people(),o=c=>(l.length>1?l.find(u=>c.owners.includes(u.entryId))?.color:void 0)??"var(--pl-accent)",d=a===s?_e(t,s):[],p=i.find(c=>c.day===a)?.items??[];return h`
			<div class="week" role="group" aria-label="Days">
				${i.map(c=>{let u=c.items.filter(f=>f.open);return h`<button
						class="wday ${c.day===s?"today":""}"
						aria-pressed=${c.day===a}
						aria-label=${`${b(c.day,e,{weekday:"long",month:"long",day:"numeric"})}: ${u.length} ${u.length===1?"task":"tasks"}`}
						@click=${()=>this._selected=c.day}
					>
						<span class="wd">${b(c.day,e,{weekday:"short"})}</span>
						<b>${Number(c.day.slice(8))}</b>
						<span class="dots">
							${u.slice(0,4).map(f=>h`<i style="background:${o(f)}"></i>`)}
							${u.length>4?h`<em>+${u.length-4}</em>`:_}
						</span>
					</button>`})}
			</div>
			${d.length?h`<h3 class="late">Overdue</h3>
						<ul>
							${d.map(c=>this._renderRow({item:c,subtasks:[]},!0))}
						</ul>`:_}
			<h3>${j(a,s,e)} · ${b(a,e,{month:"short",day:"numeric"})}</h3>
			${p.length?h`<ul>
						${p.map(c=>this._renderRow({item:c,subtasks:[]},!0,!1))}
					</ul>`:h`<div class="none-today">Nothing planned.</div>`}
		`}_renderNext(t){let e=this._today,s=yt(t,e,this._config.days??v.days,1),i=s.next.find(p=>!this._pending.has(p.task.id))??s.next[0];if(!i)return h`<div class="hero"><div class="hero-title done">All clear. Nothing open.</div></div>`;let a=i.day!==null&&i.day<e,l=s.overdue.length+s.today.length-(i.day!==null&&i.day<=e?1:0),o=i.day?j(i.day,e,this._language)+(i.time?`, ${ft(i.time,this._language)}`:""):"No date",d=this._pending.has(i.task.id);return h`
			<div class="hero">
				<div class="hero-when">
					<span class=${a?"late":""}>${o}</span>
					${i.list?h`<span><i class="dot" style=${i.list.color?`background:${i.list.color}`:""}></i>${i.list.name}</span>`:_}
					${i.others.map(p=>h`<span>@${p}</span>`)}
				</div>
				<button class="hero-title" data-task=${i.task.id} ?disabled=${!i.canWrite} @click=${()=>this._edit(i)}>${i.task.title}</button>
				<div class="hero-actions">
					<button class="btn primary" ?disabled=${!i.canWrite||d} @click=${()=>this._toggle(i)}>${x($.check)} Done</button>
					<button class="btn" ?disabled=${!i.canWrite||d} @click=${()=>this._postpone(i)}>Tomorrow</button>
				</div>
				${l>0?h`<div class="hero-more">${l} more due</div>`:_}
			</div>
		`}async _postpone(t){if(!(!t.canWrite||this._pending.has(t.task.id))){this._pending=new Set(this._pending).add(t.task.id);try{await this._send("update",t,{task_id:t.task.id,changes:_t(t.task,w(this._today,1),t.time)})}catch(e){this._pending=new Set([...this._pending].filter(s=>s!==t.task.id)),this._problem=I(e),setTimeout(()=>this._problem="",6e3)}}}_renderBoard(t){let e=this._people();return h`<div class="board">
			${e.map(s=>{let i=Y(t,this._config,e.length>1?s.entryId:null);return h`<section class="col" style="--who:${s.color}">
					<h3><i class="dot"></i>${s.name} <b>${i.filter(a=>a.open).length}</b></h3>
					${i.length?h`<ul>
								${i.map(a=>this._renderRow({item:a,subtasks:[]},!1,!0,!1))}
							</ul>`:h`<div class="none-today">Nothing open.</div>`}
				</section>`})}
		</div>`}_renderShopping(t,e){let s=Y(t,{...this._config,show_completed:!0,sort:this._config.sort??"manual"},e),i=s.filter(o=>o.open),a=s.filter(o=>!o.open),l=a.filter(o=>o.canWrite&&!this._leaving.has(o.task.id));return h`
			${i.length?this._renderList(i,t):h`<div class="empty">${a.length?"Everything is ticked off.":"Nothing on the list."}</div>`}
			${a.length?h`<h3 class="got">
							Done
							<span class="grow"></span>
							${l.length?h`<button class="clear" @click=${()=>this._clear(l)}>Clear ${l.length}</button>`:_}
						</h3>
						<ul>
							${a.map(o=>this._renderRow({item:o,subtasks:[]},!1))}
						</ul>`:_}
		`}async _clear(t){let e=t.map(s=>s.task.id);this._leaving=new Set([...this._leaving,...e]);try{for(let s of t)await this._send("delete",s,{task_id:s.task.id})}catch(s){this._problem=I(s),setTimeout(()=>this._problem="",6e3)}finally{this._leaving=new Set([...this._leaving].filter(s=>!e.includes(s)))}}_renderTiles(t){let e=this._people(),s=this._config.navigation_path;return h`<div class="tiles">
			${e.map(i=>{let a=yt(Y(t,this._config,e.length>1?i.entryId:null),this._today,this._config.days??v.days,0),l=`${i.name}: ${a.today.length} today, ${a.overdue.length} overdue`;return h`<button class="tile" style="--who:${i.color}" aria-label=${l} ?disabled=${!s} @click=${this._navigate}>
					<i class="dot"></i>
					<span class="tile-name">${i.name}</span>
					<span class="tile-counts">
						<b>${a.today.length}</b> today
						${a.overdue.length?h`<b class="late">${a.overdue.length}</b> <span class="late">late</span>`:_}
					</span>
				</button>`})}
		</div>`}_navigate(){let t=this._config.navigation_path;t&&(history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:!1}})))}_renderGlance(t){let e=this._config,s=yt(t,this._today,e.days??v.days,e.max_items??v.max_items),i=this._filter,a=i?s[i]:s.next,l=(o,d)=>h`
			<button
				class="count ${o==="overdue"?"late":""} ${s[o].length?"":"none"}"
				aria-pressed=${i===o}
				@click=${()=>this._filter=i===o?null:o}
			>
				<b>${s[o].length}</b> <span>${d}</span>
			</button>
		`;return h`
			<div class="counts">${l("overdue","Overdue")} ${l("today","Today")} ${l("upcoming","Upcoming")}</div>
			${a.length?h`<ul>
						${a.map(o=>this._renderRow({item:o,subtasks:[]},!0))}
					</ul>`:h`<div class="empty">${i?"Nothing here.":"All clear. Nothing open."}</div>`}
		`}_renderList(t,e){let s=this._people(),i=e.flatMap(d=>{let p=s.find(c=>c.entryId===d.account.entry_id)?.name??d.account.username;return d.lists.map(c=>({list:c,who:p}))}),a=i.map(({list:d,who:p})=>i.some(c=>c.list.id!==d.id&&c.list.name===d.name)?{...d,name:`${d.name} (${p})`}:d),l=ve(t,a,e.flatMap(d=>d.sections));if(l.length===1&&!l[0].key.split("/")[1]&&this._config.lists?.length===1)return h`<ul>
				${l[0].rows.map(d=>this._renderRow(d,!1))}
			</ul>`;let o=this._config.lists?.length===1;return this._renderGroups(o?l.map(d=>({...d,label:d.label.split(" \xB7 ").pop()??d.label})):l,!1)}_renderGroups(t,e,s=!0){return t.some(i=>i.rows.length)?h`<div class="groups">
			${t.map(i=>h`<section>
				<h3 class=${i.late?"late":""}>
					${i.color!==void 0?h`<i class="dot" style=${i.color?`background:${i.color}`:""}></i>`:_}
					${i.label}
				</h3>
				${i.rows.length?h`<ul>
							${i.rows.map(a=>this._renderRow(a,e,s))}
						</ul>`:h`<div class="none-today">Nothing planned.</div>`}
				</section>`)}
		</div>`:h`<div class="empty">Nothing to do here.</div>`}_renderRow(t,e,s=!0,i=!0){let{item:a}=t,{task:l}=a,o=this._pending.has(l.id),d=a.open===o,p=this._leaving.has(l.id),c=a.open&&a.day!==null&&a.day<this._today,u=this._person||!i?[]:this._people(),f=u.length>1?u.filter(m=>a.owners.includes(m.entryId)):[],y=[a.day&&(s||c)?j(a.day,this._today,this._language):"",a.day&&a.time?ft(a.time,this._language):""].filter(Boolean).join(", ");return h`
			<li>
				<div class="row ${p?"leaving":""}">
					${f.length?h`<span class="who" role="img" aria-label=${f.map(m=>m.name).join(", ")} title=${f.map(m=>m.name).join(", ")}>
								${f.map(m=>h`<i style="background:${m.color}"></i>`)}
							</span>`:_}
					<button
						class="check p${l.priority} ${d?"closed":""}"
						role="checkbox"
						aria-checked=${d}
						aria-label=${`${d?"Reopen":"Complete"} ${l.title}`}
						?disabled=${!a.canWrite||p}
						@click=${()=>this._toggle(a)}
					>
						${x($.check)}
					</button>
					<button class="what" data-task=${l.id} ?disabled=${!a.canWrite||p} @click=${()=>this._edit(a)}>
						<span class="name">${l.title}</span>
						<span class="meta">
							${y?h`<span class=${c?"late":""}>${y}</span>`:_}
							${l.recurrence?h`<span title="Repeats">${x($.repeat)}</span>`:_}
							${e&&a.list?h`<span class="in"><i class="dot" style=${a.list.color?`background:${a.list.color}`:""}></i>${a.list.name}</span>`:_}
							${a.others.map(m=>h`<span class="to">@${m}</span>`)}
							${l.tags.map(m=>h`<span class="tag">#${m}</span>`)}
						</span>
					</button>
				</div>
				${t.subtasks.length?h`<ul>
							${Mt(t.subtasks).map(m=>this._renderRow(m,!1))}
						</ul>`:_}
			</li>
		`}_renderHeatmap(t){let e=this._config.range??v.range,s=this._anchor??this._today,i=this._language,a=Pt(this._hass?.locale?.first_weekday,i),l=Lt(t,"month",s,a),o=this._selected??this._today,d=m=>{this._anchor=e==="year"?G(s,12*m):G(s,m)},p=e==="year"?s.slice(0,4):b(s.slice(0,7)+"-01",i,{month:"long",year:"numeric"}),c=l[0]?.map(m=>b(m.day,i,{weekday:"narrow"}))??[],u=m=>h`
				<button
					class="cell l${m.level} ${m.inRange?"":"out"} ${m.day===this._today?"today":""}"
					style="--level:${m.level}"
					aria-pressed=${m.day===o}
					aria-label=${`${b(m.day,i,{weekday:"long",month:"long",day:"numeric"})}: ${m.count} ${m.count===1?"task":"tasks"}`}
					title=${`${b(m.day,i,{month:"short",day:"numeric"})}: ${m.count}`}
					tabindex=${m.inRange?0:-1}
					@click=${()=>this._selected=m.day}
				>
					${Number(m.day.slice(8))}
				</button>
			`,f=e==="year"?Array.from({length:12},(m,k)=>`${s.slice(0,4)}-${String(k+1).padStart(2,"0")}-01`):[],y=t.filter(m=>m.day===o);return h`
			<div class="nav">
				<strong>${p}</strong>
				<button aria-label="Today" title="Today" @click=${()=>(this._anchor=null,this._selected=null)}>${x($.today)}</button>
				<button aria-label="Earlier" @click=${()=>d(-1)}>${x($.left)}</button>
				<button aria-label="Later" @click=${()=>d(1)}>${x($.right)}</button>
			</div>
			${e==="year"?h`<div class="year">
						${f.map(m=>h`
								<div>
									<div class="month-name">${b(m,i,{month:"short"})}</div>
									<div class="heat small">${Lt(t,"month",m,a).flat().map(u)}</div>
								</div>
							`)}
					</div>`:h`<div class="heat">${c.map(m=>h`<span class="wd">${m}</span>`)} ${l.flat().map(u)}</div>`}
			<div class="legend">
				Less ${[0,1,2,3,4].map(m=>h`<i style="--level:${m}"></i>`)} More
			</div>
			<h3>${j(o,this._today,i)} · ${b(o,i,{month:"short",day:"numeric"})}</h3>
			${y.length?h`<ul>
						${y.map(m=>this._renderRow({item:m,subtasks:[]},!0,!1))}
					</ul>`:h`<div class="none-today">Nothing planned.</div>`}
		`}_renderSubtasks(t){let e=this._children(t);return h`
			<label id="subs">Subtasks</label>
			<ul class="subs" aria-labelledby="subs">
				${e.map(s=>{let i=this._pending.has(s.id),a=s.status==="open"===i;return h`<li>
						<button
							type="button"
							class="check p${s.priority} ${a?"closed":""}"
							role="checkbox"
							aria-checked=${a}
							aria-label=${`${a?"Reopen":"Complete"} ${s.title}`}
							@click=${()=>!i&&this._subtask(s.status==="open"?"complete":"reopen",{task_id:s.id},s.id)}
						>
							${x($.check)}
						</button>
						<input
							type="text"
							maxlength="2000"
							aria-label="Subtask title"
							class=${a?"closed":""}
							.value=${s.title}
							@change=${l=>this._renameSubtask(l,s)}
							@keydown=${l=>{l.key!=="Enter"||l.isComposing||(l.preventDefault(),l.target.blur())}}
						/>
						<button
							type="button"
							class="remove"
							aria-label=${`Delete ${s.title}`}
							title="Delete"
							@click=${()=>this._subtask("delete",{task_id:s.id},void 0,`${s.title} moved to the trash.`)}
						>
							${x($.close)}
						</button>
					</li>`})}
			</ul>
			<input class="sub-add" type="text" maxlength="2000" aria-label="Add a subtask" placeholder="Add a subtask" @keydown=${this._addSubtask} />
			${this._draft?.note?h`<div class="note" role="status">${this._draft.note}</div>`:_}
		`}_renderCalendar(t){let e=this._language,s=this._today,i=this._range??(this._config.range==="week"?"week":"month"),a=this._anchor??s,l=Pt(this._hass?.locale?.first_weekday,e),d=$e(t,i,a,l,this._moves).flat(),p=this._selected??s,c=this._person?[]:this._people(),u=g=>(c.length>1?c.find(E=>g.owners.includes(E.entryId))?.color:void 0)??g.list?.color??"var(--pl-accent)",f=g=>{this._anchor=i==="week"?w(a,7*g):G(a,g)},y=d.filter(g=>g.inRange),m=i==="week"?new Intl.DateTimeFormat(e,{month:"short",day:"numeric",timeZone:"UTC"}).formatRange(new Date(`${y[0].day}T00:00:00Z`),new Date(`${y[y.length-1].day}T00:00:00Z`)):b(a.slice(0,7)+"-01",e,{month:"long",year:"numeric"}),k=i==="week"?8:3,A=(g,E)=>{let{task:P}=g,V=g.time?ft(g.time,e):"",Ut=g.canWrite&&g.open;return h`<button
				data-task=${P.id}
				class="ctask ${g.open?"":"closed"} ${this._dragId===P.id?"lifted":""} ${Ut?"movable":""}"
				style="--c:${u(g)}"
				title=${V?`${V} ${P.title}`:P.title}
				aria-label=${V?`${P.title}, ${V}`:P.title}
				@pointerdown=${H=>this._grab(H,g)}
				@touchmove=${this._touchMove}
				@contextmenu=${H=>Ut&&H.preventDefault()}
				@keydown=${H=>E&&this._nudge(H,g,E)}
				@click=${H=>{H.stopPropagation(),!this._swallowClick&&(g.canWrite?this._edit(g):E&&(this._selected=E))}}
			>
				${i==="week"&&V?h`<b>${V}</b>`:_}<span>${P.title}</span>
			</button>`},st=d.find(g=>g.day===p)?.items??t.filter(g=>(this._moves.get(g.task.id)??g.day)===p),nt=!!this._config.undated_tray,L=nt&&this._trayShown,B=L?t.filter(g=>g.open&&!g.day&&!g.task.parentId&&!this._moves.has(g.task.id)):[];return h`
			<div class="nav">
				<strong>${m}</strong>
				<div class="seg" role="group" aria-label="Show">
					<button aria-pressed=${i==="month"} @click=${()=>this._range="month"}>Month</button>
					<button aria-pressed=${i==="week"} @click=${()=>this._range="week"}>Week</button>
				</div>
				${nt?h`<button class="tray-toggle" aria-label="Undated tasks" title="Undated tasks" aria-pressed=${L} @click=${this._toggleTray}>
							${x($.tray)}
						</button>`:_}
				<button aria-label="Today" title="Today" @click=${()=>(this._anchor=null,this._selected=null)}>${x($.today)}</button>
				<button aria-label="Earlier" @click=${()=>f(-1)}>${x($.left)}</button>
				<button aria-label="Later" @click=${()=>f(1)}>${x($.right)}</button>
			</div>
			<div class="calwrap ${L?"with-tray":""}">
			<div
				class="cal ${i}"
				@keydown=${g=>g.key==="Escape"&&this._drag&&this._endDrag()}
			>
				${d.slice(0,7).map(g=>h`<span class="wd">${b(g.day,e,{weekday:"short"})}</span>`)}
				${d.map(g=>h`<div
						class="cday ${g.inRange?"":"out"} ${g.day===s?"today":""} ${this._dropDay===g.day?"drop":""}"
						data-day=${g.day}
						aria-current=${g.day===p?"date":"false"}
						@click=${()=>this._selected=g.day}
					>
						<button
							class="dnum"
							aria-pressed=${g.day===p}
							aria-label=${`${b(g.day,e,{weekday:"long",month:"long",day:"numeric"})}: ${g.items.length} ${g.items.length===1?"task":"tasks"}`}
						>
							${Number(g.day.slice(8))}
						</button>
						${Ct(g.items.slice(0,g.items.length>k?k-1:k),E=>E.task.id,E=>A(E,g.day))}
						${g.items.length>k?h`<span class="more">+${g.items.length-k+1}</span>`:_}
					</div>`)}
			</div>
			${L?h`<section class="tray" aria-label="Undated tasks" @keydown=${g=>g.key==="Escape"&&this._drag&&this._endDrag()}>
						<h4>Undated <span>${B.length}</span></h4>
						${B.length?h`<div class="tray-tasks">
									${Ct(B,g=>g.task.id,g=>A(g,null))}
								</div>`:h`<p class="tray-none">No undated tasks.</p>`}
					</section>`:_}
			</div>
			<h3>${j(p,s,e)} · ${b(p,e,{month:"short",day:"numeric"})}</h3>
			${st.length?h`<ul>
						${st.map(g=>this._renderRow({item:g,subtasks:[]},!0,!1))}
					</ul>`:h`<div class="none-today">Nothing planned.</div>`}
		`}_grab(t,e){if(!e.canWrite||!e.open||t.button>0||this._drag)return;let s=t.pointerType!=="mouse",i={item:e,pointer:t.pointerId,x:t.clientX,y:t.clientY,touch:s,active:!1};this._drag=i,t.currentTarget.setPointerCapture?.(t.pointerId),window.addEventListener("pointermove",this._onDragMove,!0),window.addEventListener("pointerup",this._onDragEnd,!0),window.addEventListener("pointercancel",this._endDrag,!0),s&&(i.hold=setTimeout(()=>this._lift(i),qe))}_lift(t){this._drag===t&&(clearTimeout(t.hold),t.active=!0,this._dragId=t.item.task.id,this._dropDay=this._moves.get(t.item.task.id)??t.item.day)}_nudge(t,e,s){let a={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[t.key];!t.altKey||a===void 0||!e.canWrite||!e.open||(t.preventDefault(),this._focusTask=e.task.id,this._focusKind="ctask",this._placed=t.currentTarget,this._moveTo(e,w(s,a)))}updated(){let t=this._focusTask;if(!t)return;let e=this.renderRoot.activeElement,s=e?e!==this._placed&&e.dataset.task!==t:!!document.activeElement&&document.activeElement!==document.body;if(this._draft||s){this._focusTask=null,this._focusHeld=!1,this._placed=null;return}let i=[...this.renderRoot.querySelectorAll(`.${this._focusKind}`)].find(a=>a.dataset.task===t);i&&e!==i&&i.focus(),i&&(this._placed=i),!this._moves.has(t)&&!this._focusHeld&&(this._focusTask=null)}_hit(t,e){return this.renderRoot.elementFromPoint?.(t,e)??null}_dayAt(t,e){return this._hit(t,e)?.closest("[data-day]")?.dataset.day??null}_overTray(t,e){return!!this._hit(t,e)?.closest(".tray")}async _moveTo(t,e){let s=t.task.id;this._moves=new Map(this._moves).set(s,e);try{await this._send("update",t,{task_id:s,changes:_t(t.task,e,t.time)})}catch(i){let a=new Map(this._moves);a.delete(s),this._moves=a,this._problem=I(i),setTimeout(()=>this._problem="",6e3)}}_closeDialog(){let t=this._draft,e=this._opener,s=this.renderRoot.activeElement;if(s?.closest(".scrim")&&s.blur(),this._draft=null,this._opener=null,this._placed=null,!t||!e)return;let i=t.item.task.id;this._focusTask=i,this._focusKind=e.classList.contains("ctask")?"ctask":e.classList.contains("hero-title")?"hero-title":"what",this._focusHeld=!0,setTimeout(()=>{this._focusTask===i&&(this._focusHeld=!1,this._focusTask=null)},3e3)}_trapTab(t){if(t.key!=="Tab")return;let e=t.currentTarget,s=[...e.querySelectorAll("input, select, textarea, button")].filter(o=>!o.disabled&&!o.closest("[hidden]")),i=s[0],a=s[s.length-1];if(!i||!a)return;let l=this.renderRoot.activeElement;t.shiftKey&&(l===i||l===e)?(t.preventDefault(),a.focus()):!t.shiftKey&&l===a&&(t.preventDefault(),i.focus())}_renderDialog(t){let e=()=>this._closeDialog();return h`
			<div
				class="scrim"
				@click=${s=>s.target===s.currentTarget&&e()}
				@keydown=${s=>s.key==="Escape"&&e()}
			>
				<form role="dialog" aria-modal="true" aria-label="Edit task" tabindex="-1" @submit=${this._save} @keydown=${this._trapTab}>
					<label>
						Title
						<input
							type="text"
							maxlength="2000"
							.value=${t.title}
							@input=${s=>this._set({title:s.target.value})}
						/>
					</label>
					<div class="two">
						<label>
							Date
							<input type="date" .value=${t.day} @input=${s=>this._set({day:s.target.value})} />
						</label>
						<label>
							Time
							<input
								type="time"
								.value=${t.time}
								?disabled=${!t.day}
								@input=${s=>this._set({time:s.target.value})}
							/>
						</label>
					</div>
					${t.listId!==null?h`<label>
								List
								<select @change=${s=>this._set({listId:s.target.value})}>
									${this._moveTargets(t.item).map(s=>h`<option value=${s.id} ?selected=${s.id===t.listId}>${s.name}</option>`)}
								</select>
							</label>`:_}
					<label id="prio">Priority</label>
					<div class="prio" role="group" aria-labelledby="prio">
						${Ke.map((s,i)=>h`<button type="button" aria-pressed=${t.priority===i} @click=${()=>this._set({priority:i})}>
									${s}
								</button>`)}
					</div>
					${t.assignees?h`<label id="assign">Assigned to</label>
								<div class="assign" role="group" aria-labelledby="assign">
									${this._assignable(t.item).map(s=>h`<button
												type="button"
												class="chip"
												aria-pressed=${t.assignees.includes(s.id)}
												@click=${()=>this._set({assignees:t.assignees.includes(s.id)?t.assignees.filter(i=>i!==s.id):[...t.assignees,s.id]})}
											>
												${s.me?"Me":s.name}
											</button>`)}
								</div>`:_}
					<label>
						Tags
						<input
							type="text"
							placeholder="home, yard/front"
							.value=${t.tags}
							@input=${s=>this._set({tags:s.target.value})}
						/>
					</label>
					<label>
						Notes
						<textarea .value=${t.notes} @input=${s=>this._set({notes:s.target.value})}></textarea>
					</label>
					${t.item.task.parentId?_:this._renderSubtasks(t.item)}
					${t.error?h`<div class="error" role="alert">${t.error}</div>`:_}
					<div class="actions">
						<button type="button" class="btn danger" ?disabled=${t.saving} @click=${this._delete}>Delete</button>
						<span class="grow"></span>
						<button type="button" class="btn" @click=${e}>Cancel</button>
						<button type="submit" class="btn primary" ?disabled=${t.saving}>Save</button>
					</div>
				</form>
			</div>
		`}};customElements.get("pecklist-card")||customElements.define("pecklist-card",zt);var Ot=window;Ot.customCards??=[];Ot.customCards.some(r=>r.type==="pecklist-card")||Ot.customCards.push({type:"pecklist-card",name:"PeckList",description:"Tasks from PeckList: at a glance, lists, an agenda, a calendar or a busy-day heatmap.",preview:!0,documentationURL:"https://github.com/KillSwitchIO/pecklist-card"});export{zt as PeckListCard,ke as TRAY_KEY};
