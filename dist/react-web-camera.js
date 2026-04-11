import ne, { forwardRef as ae, useRef as Z, useState as V, useCallback as Q, useImperativeHandle as oe, useEffect as se } from "react";
var q = { exports: {} }, P = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var K;
function ce() {
  if (K) return P;
  K = 1;
  var v = Symbol.for("react.transitional.element"), g = Symbol.for("react.fragment");
  function T(k, o, i) {
    var b = null;
    if (i !== void 0 && (b = "" + i), o.key !== void 0 && (b = "" + o.key), "key" in o) {
      i = {};
      for (var R in o)
        R !== "key" && (i[R] = o[R]);
    } else i = o;
    return o = i.ref, {
      $$typeof: v,
      type: k,
      key: b,
      ref: o !== void 0 ? o : null,
      props: i
    };
  }
  return P.Fragment = g, P.jsx = T, P.jsxs = T, P;
}
var x = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ee;
function ie() {
  return ee || (ee = 1, process.env.NODE_ENV !== "production" && function() {
    function v(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === M ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case S:
          return "Fragment";
        case $:
          return "Profiler";
        case A:
          return "StrictMode";
        case t:
          return "Suspense";
        case w:
          return "SuspenseList";
        case D:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case E:
            return "Portal";
          case N:
            return (e.displayName || "Context") + ".Provider";
          case C:
            return (e._context.displayName || "Context") + ".Consumer";
          case a:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case l:
            return r = e.displayName || null, r !== null ? r : v(e.type) || "Memo";
          case d:
            r = e._payload, e = e._init;
            try {
              return v(e(r));
            } catch {
            }
        }
      return null;
    }
    function g(e) {
      return "" + e;
    }
    function T(e) {
      try {
        g(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var n = r.error, s = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return n.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          s
        ), g(e);
      }
    }
    function k(e) {
      if (e === S) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === d)
        return "<...>";
      try {
        var r = v(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function o() {
      var e = h.A;
      return e === null ? null : e.getOwner();
    }
    function i() {
      return Error("react-stack-top-frame");
    }
    function b(e) {
      if (I.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function R(e, r) {
      function n() {
        G || (G = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      n.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: n,
        configurable: !0
      });
    }
    function u() {
      var e = v(this.type);
      return J[e] || (J[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function Y(e, r, n, s, p, m, L, U) {
      return n = m.ref, e = {
        $$typeof: y,
        type: e,
        key: r,
        props: m,
        _owner: p
      }, (n !== void 0 ? n : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: u
      }) : Object.defineProperty(e, "ref", { enumerable: !1, value: null }), e._store = {}, Object.defineProperty(e._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(e, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(e, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: L
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: U
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function f(e, r, n, s, p, m, L, U) {
      var c = r.children;
      if (c !== void 0)
        if (s)
          if (re(c)) {
            for (s = 0; s < c.length; s++)
              j(c[s]);
            Object.freeze && Object.freeze(c);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else j(c);
      if (I.call(r, "key")) {
        c = v(e);
        var O = Object.keys(r).filter(function(te) {
          return te !== "key";
        });
        s = 0 < O.length ? "{key: someKey, " + O.join(": ..., ") + ": ...}" : "{key: someKey}", B[c + s] || (O = 0 < O.length ? "{" + O.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          s,
          c,
          O,
          c
        ), B[c + s] = !0);
      }
      if (c = null, n !== void 0 && (T(n), c = "" + n), b(r) && (T(r.key), c = "" + r.key), "key" in r) {
        n = {};
        for (var W in r)
          W !== "key" && (n[W] = r[W]);
      } else n = r;
      return c && R(
        n,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), Y(
        e,
        c,
        m,
        p,
        o(),
        n,
        L,
        U
      );
    }
    function j(e) {
      typeof e == "object" && e !== null && e.$$typeof === y && e._store && (e._store.validated = 1);
    }
    var _ = ne, y = Symbol.for("react.transitional.element"), E = Symbol.for("react.portal"), S = Symbol.for("react.fragment"), A = Symbol.for("react.strict_mode"), $ = Symbol.for("react.profiler"), C = Symbol.for("react.consumer"), N = Symbol.for("react.context"), a = Symbol.for("react.forward_ref"), t = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), l = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), D = Symbol.for("react.activity"), M = Symbol.for("react.client.reference"), h = _.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, I = Object.prototype.hasOwnProperty, re = Array.isArray, F = console.createTask ? console.createTask : function() {
      return null;
    };
    _ = {
      react_stack_bottom_frame: function(e) {
        return e();
      }
    };
    var G, J = {}, X = _.react_stack_bottom_frame.bind(
      _,
      i
    )(), H = F(k(i)), B = {};
    x.Fragment = S, x.jsx = function(e, r, n, s, p) {
      var m = 1e4 > h.recentlyCreatedOwnerStacks++;
      return f(
        e,
        r,
        n,
        !1,
        s,
        p,
        m ? Error("react-stack-top-frame") : X,
        m ? F(k(e)) : H
      );
    }, x.jsxs = function(e, r, n, s, p) {
      var m = 1e4 > h.recentlyCreatedOwnerStacks++;
      return f(
        e,
        r,
        n,
        !0,
        s,
        p,
        m ? Error("react-stack-top-frame") : X,
        m ? F(k(e)) : H
      );
    };
  }()), x;
}
process.env.NODE_ENV === "production" ? q.exports = ce() : q.exports = ie();
var z = q.exports;
const le = {
  back: "environment",
  front: "user"
}, fe = ae(
  ({
    className: v,
    style: g,
    videoClassName: T,
    videoStyle: k,
    getFileName: o,
    captureMode: i = "back",
    captureType: b = "jpeg",
    captureQuality: R = 0.8,
    onError: u
  }, Y) => {
    const f = Z(null), j = Z(null), [_, y] = V(null), [E, S] = V(
      le[i]
    ), [A, $] = V([]), C = Q(async () => {
      const a = f.current, t = j.current;
      return !a || !t || a.readyState < 2 ? null : new Promise((w) => {
        const l = t.getContext("2d"), d = a.videoWidth || 640, D = a.videoHeight || 480;
        t.width = d, t.height = D, l.drawImage(a, 0, 0, d, D);
        const M = `image/${b}`;
        t.toBlob(
          async (h) => {
            if (!h) return;
            const I = new File(
              [h],
              (o == null ? void 0 : o()) ?? `capture-${Date.now()}.${b}`,
              {
                type: M,
                lastModified: Date.now()
              }
            );
            w(I);
          },
          M,
          R
        );
      });
    }, [b, R, o]), N = Q(async () => {
      _ && (_.getTracks().forEach((t) => t.stop()), f.current && (f.current.srcObject = null));
      const a = E === "user" ? "environment" : "user";
      S(a);
      try {
        let t;
        if (A.length >= 2) {
          const l = A.find(
            (d) => a === "user" ? d.label.toLowerCase().includes("front") : d.label.toLowerCase().includes("back")
          );
          t = l ? { video: { deviceId: { exact: l.deviceId } } } : { video: { facingMode: { ideal: a } } };
        } else
          t = { video: { facingMode: { ideal: a } } };
        const w = await navigator.mediaDevices.getUserMedia(t);
        f.current && (f.current.srcObject = w), y(w);
      } catch (t) {
        u == null || u(t);
      }
    }, [_, E, A, u]);
    return oe(
      Y,
      () => ({
        capture: C,
        switch: N,
        getMode: () => E === "environment" ? "back" : "front"
      }),
      [E, C, N]
    ), se(() => {
      let a;
      const t = f.current;
      return (async () => {
        try {
          const l = await navigator.mediaDevices.enumerateDevices();
          $(l.filter((d) => d.kind === "videoinput")), a = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: E } }
          }), t && (t.srcObject = a, t.onloadedmetadata = () => t == null ? void 0 : t.play()), y(a);
        } catch (l) {
          u == null || u(l);
        }
      })(), () => {
        a == null || a.getTracks().forEach((l) => l.stop()), t && (t.srcObject = null);
      };
    }, [E, u]), /* @__PURE__ */ z.jsxs("div", { className: v, style: g, children: [
      /* @__PURE__ */ z.jsx(
        "video",
        {
          ref: f,
          className: T,
          autoPlay: !0,
          playsInline: !0,
          muted: !0,
          style: {
            ...k,
            display: "block",
            objectFit: "cover",
            height: "100%",
            width: "100%"
          },
          children: "Video stream not available."
        }
      ),
      /* @__PURE__ */ z.jsx("canvas", { ref: j, style: { display: "none" } })
    ] });
  }
);
export {
  fe as WebCamera,
  fe as default
};
