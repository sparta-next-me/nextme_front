module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/admin/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*#__PURE__*/ const { jsxDEV: _jsxDEV } = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
_jsxDEV("div", {
    className: "flex items-center gap-4",
    children: [
        /*#__PURE__*/ _jsxDEV("div", {
            className: "hidden md:block text-right",
            children: [
                /*#__PURE__*/ _jsxDEV("p", {
                    className: "text-sm font-bold leading-none",
                    children: [
                        userName,
                        "님"
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin/page.tsx",
                    lineNumber: 4,
                    columnNumber: 5
                }, /*TURBOPACK member replacement*/ __turbopack_context__.e),
                /*#__PURE__*/ _jsxDEV("p", {
                    className: "text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-black italic",
                    children: "Standard User"
                }, void 0, false, {
                    fileName: "[project]/app/admin/page.tsx",
                    lineNumber: 5,
                    columnNumber: 5
                }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
            ]
        }, void 0, true, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 3,
            columnNumber: 3
        }, /*TURBOPACK member replacement*/ __turbopack_context__.e),
        /*#__PURE__*/ _jsxDEV("div", {
            className: "flex items-center gap-1",
            children: [
                /*#__PURE__*/ _jsxDEV(Link, {
                    href: "/dashboard/chat",
                    children: /*#__PURE__*/ _jsxDEV(Button, {
                        variant: "ghost",
                        size: "icon",
                        className: "rounded-xl",
                        children: /*#__PURE__*/ _jsxDEV(MessageSquare, {
                            className: "h-5 w-5"
                        }, void 0, false, {
                            fileName: "[project]/app/admin/page.tsx",
                            lineNumber: 14,
                            columnNumber: 9
                        }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 13,
                        columnNumber: 7
                    }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
                }, void 0, false, {
                    fileName: "[project]/app/admin/page.tsx",
                    lineNumber: 12,
                    columnNumber: 5
                }, /*TURBOPACK member replacement*/ __turbopack_context__.e),
                /*#__PURE__*/ _jsxDEV(Link, {
                    href: "/dashboard/settings",
                    children: /*#__PURE__*/ _jsxDEV(Button, {
                        variant: "ghost",
                        size: "icon",
                        className: "rounded-xl",
                        children: /*#__PURE__*/ _jsxDEV(Settings, {
                            className: "h-5 w-5"
                        }, void 0, false, {
                            fileName: "[project]/app/admin/page.tsx",
                            lineNumber: 19,
                            columnNumber: 9
                        }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 18,
                        columnNumber: 7
                    }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
                }, void 0, false, {
                    fileName: "[project]/app/admin/page.tsx",
                    lineNumber: 17,
                    columnNumber: 5
                }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
            ]
        }, void 0, true, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 11,
            columnNumber: 3
        }, /*TURBOPACK member replacement*/ __turbopack_context__.e),
        /*#__PURE__*/ _jsxDEV(Avatar, {
            className: "h-9 w-9 border-2 border-primary/20 shadow-sm",
            children: /*#__PURE__*/ _jsxDEV(AvatarFallback, {
                className: "bg-primary text-primary-foreground text-xs font-black uppercase",
                children: userName?.charAt(0)
            }, void 0, false, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 26,
                columnNumber: 5
            }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
        }, void 0, false, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 25,
            columnNumber: 3
        }, /*TURBOPACK member replacement*/ __turbopack_context__.e),
        /*#__PURE__*/ _jsxDEV(Button, {
            variant: "ghost",
            size: "icon",
            onClick: handleLogout,
            className: "rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all",
            children: /*#__PURE__*/ _jsxDEV(LogOut, {
                className: "h-5 w-5"
            }, void 0, false, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 38,
                columnNumber: 5
            }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
        }, void 0, false, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 32,
            columnNumber: 3
        }, /*TURBOPACK member replacement*/ __turbopack_context__.e)
    ]
}, void 0, true, {
    fileName: "[project]/app/admin/page.tsx",
    lineNumber: 1,
    columnNumber: 1
}, /*TURBOPACK member replacement*/ __turbopack_context__.e);
}),
"[project]/app/admin/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/admin/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c98d1099._.js.map