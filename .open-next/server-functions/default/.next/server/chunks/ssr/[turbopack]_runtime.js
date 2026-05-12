const RUNTIME_PUBLIC_PATH = "server/chunks/ssr/[turbopack]_runtime.js";
const RELATIVE_ROOT_PATH = "..";
const ASSET_PREFIX = "/_next/";
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache[id];
    if (!module) {
        // This is invoked when a module is merged into another module, thus it wasn't invoked via
        // instantiateModule and the cache entry wasn't created yet.
        module = createModuleObject(id);
        moduleCache[id] = module;
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
const BindingTag_Value = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings);
}
contextPrototype.s = esmExport;
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                for (const obj of reexportedObjects){
                    const value = Reflect.get(obj, prop);
                    if (value !== undefined) return value;
                }
                return undefined;
            },
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
function isPromise(maybePromise) {
    return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}
function isAsyncModuleExt(obj) {
    return turbopackQueues in obj;
}
function createPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        reject = rej;
        resolve = res;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let moduleId = chunkModules[i];
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Each chunk item has a 'primary id' and optional additional ids. If the primary id is already
        // present we know all the additional ids are also present, so we don't need to check.
        if (!moduleFactories.has(moduleId)) {
            const moduleFactoryFn = chunkModules[end];
            applyModuleFactoryName(moduleFactoryFn);
            newModuleId?.(moduleId);
            for(; i < end; i++){
                moduleId = chunkModules[i];
                moduleFactories.set(moduleId, moduleFactoryFn);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
// everything below is adapted from webpack
// https://github.com/webpack/webpack/blob/6be4065ade1e252c1d8dcba4af0f43e32af1bdc1/lib/runtime/AsyncModuleRuntimeModule.js#L13
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');
function resolveQueue(queue) {
    if (queue && queue.status !== 1) {
        queue.status = 1;
        queue.forEach((fn)=>fn.queueCount--);
        queue.forEach((fn)=>fn.queueCount-- ? fn.queueCount++ : fn());
    }
}
function wrapDeps(deps) {
    return deps.map((dep)=>{
        if (dep !== null && typeof dep === 'object') {
            if (isAsyncModuleExt(dep)) return dep;
            if (isPromise(dep)) {
                const queue = Object.assign([], {
                    status: 0
                });
                const obj = {
                    [turbopackExports]: {},
                    [turbopackQueues]: (fn)=>fn(queue)
                };
                dep.then((res)=>{
                    obj[turbopackExports] = res;
                    resolveQueue(queue);
                }, (err)=>{
                    obj[turbopackError] = err;
                    resolveQueue(queue);
                });
                return obj;
            }
        }
        return {
            [turbopackExports]: dep,
            [turbopackQueues]: ()=>{}
        };
    });
}
function asyncModule(body, hasAwait) {
    const module = this.m;
    const queue = hasAwait ? Object.assign([], {
        status: -1
    }) : undefined;
    const depQueues = new Set();
    const { resolve, reject, promise: rawPromise } = createPromise();
    const promise = Object.assign(rawPromise, {
        [turbopackExports]: module.exports,
        [turbopackQueues]: (fn)=>{
            queue && fn(queue);
            depQueues.forEach(fn);
            promise['catch'](()=>{});
        }
    });
    const attributes = {
        get () {
            return promise;
        },
        set (v) {
            // Calling `esmExport` leads to this.
            if (v !== promise) {
                promise[turbopackExports] = v;
            }
        }
    };
    Object.defineProperty(module, 'exports', attributes);
    Object.defineProperty(module, 'namespaceObject', attributes);
    function handleAsyncDependencies(deps) {
        const currentDeps = wrapDeps(deps);
        const getResult = ()=>currentDeps.map((d)=>{
                if (d[turbopackError]) throw d[turbopackError];
                return d[turbopackExports];
            });
        const { promise, resolve } = createPromise();
        const fn = Object.assign(()=>resolve(getResult), {
            queueCount: 0
        });
        function fnQueue(q) {
            if (q !== queue && !depQueues.has(q)) {
                depQueues.add(q);
                if (q && q.status === 0) {
                    fn.queueCount++;
                    q.push(fn);
                }
            }
        }
        currentDeps.map((dep)=>dep[turbopackQueues](fnQueue));
        return fn.queueCount ? promise : getResult();
    }
    function asyncResult(err) {
        if (err) {
            reject(promise[turbopackError] = err);
        } else {
            resolve(promise[turbopackExports]);
        }
        resolveQueue(queue);
    }
    body(handleAsyncDependencies, asyncResult);
    if (queue && queue.status === -1) {
        queue.status = 0;
    }
}
contextPrototype.a = asyncModule;
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  case "@libsql/client":
    raw = await import("@libsql/client");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime-utils.ts" />
function readWebAssemblyAsResponse(path) {
    const { createReadStream } = require('fs');
    const { Readable } = require('stream');
    const stream = createReadStream(path);
    // @ts-ignore unfortunately there's a slight type mismatch with the stream.
    return new Response(Readable.toWeb(stream), {
        headers: {
            'content-type': 'application/wasm'
        }
    });
}
async function compileWebAssemblyFromPath(path) {
    const response = readWebAssemblyAsResponse(path);
    return await WebAssembly.compileStreaming(response);
}
async function instantiateWebAssemblyFromPath(path, importsObj) {
    const response = readWebAssemblyAsResponse(path);
    const { instance } = await WebAssembly.instantiateStreaming(response, importsObj);
    return instance.exports;
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime-utils.ts" />
/// <reference path="../shared-node/base-externals-utils.ts" />
/// <reference path="../shared-node/node-externals-utils.ts" />
/// <reference path="../shared-node/node-wasm-utils.ts" />
var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    return SourceType;
}(SourceType || {});
process.env.TURBOPACK = '1';
const nodeContextPrototype = Context.prototype;
const url = require('url');
const moduleFactories = new Map();
nodeContextPrototype.M = moduleFactories;
const moduleCache = Object.create(null);
nodeContextPrototype.c = moduleCache;
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
nodeContextPrototype.R = resolvePathFromModule;
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (e) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        throw new Error(errorMessage, {
            cause: e
        });
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (e) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(new Error(errorMessage, {
                cause: e
            }));
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
async function loadWebAssembly(chunkPath, _edgeModule, imports) {
  const mod = await loadWasmChunk(chunkPath);
  const { exports } = await WebAssembly.instantiate(mod, imports);
  return exports;
}
contextPrototype.w = loadWebAssembly;
function loadWebAssemblyModule(chunkPath, _edgeModule) {
  return loadWasmChunk(chunkPath);
}
contextPrototype.u = loadWebAssemblyModule;
function getWorkerBlobURL(_chunks) {
    throw new Error('Worker blobs are not implemented yet for Node.js');
}
nodeContextPrototype.b = getWorkerBlobURL;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        let instantiationReason;
        switch(sourceType){
            case 0:
                instantiationReason = `as a runtime entry of chunk ${sourceData}`;
                break;
            case 1:
                instantiationReason = `because it was required from module ${sourceData}`;
                break;
            default:
                invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
        }
        throw new Error(`Module ${id} was instantiated ${instantiationReason}, but the module factory is not available.`);
    }
    const module1 = createModuleObject(id);
    const exports = module1.exports;
    moduleCache[id] = module1;
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache[id];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, 1, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, 0, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache[moduleId];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[externals]_next_dist_compiled_@vercel_og_index_node_055f47ab.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_next_dist_compiled_@vercel_og_index_node_055f47ab.js");
      case "server/chunks/ssr/[root-of-the-server]__05118e4e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__05118e4e._.js");
      case "server/chunks/ssr/[root-of-the-server]__236254df._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__236254df._.js");
      case "server/chunks/ssr/[root-of-the-server]__2dec8eaa._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__2dec8eaa._.js");
      case "server/chunks/ssr/[root-of-the-server]__79f16aec._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__79f16aec._.js");
      case "server/chunks/ssr/[root-of-the-server]__989e7f11._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__989e7f11._.js");
      case "server/chunks/ssr/[root-of-the-server]__98d6514a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__98d6514a._.js");
      case "server/chunks/ssr/[root-of-the-server]__b3572150._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__b3572150._.js");
      case "server/chunks/ssr/[root-of-the-server]__b7c21369._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__b7c21369._.js");
      case "server/chunks/ssr/[root-of-the-server]__d52d1cde._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__d52d1cde._.js");
      case "server/chunks/ssr/[root-of-the-server]__f0ed272e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__f0ed272e._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_3a55450e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_3a55450e._.js");
      case "server/chunks/ssr/_5339f8a8._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_5339f8a8._.js");
      case "server/chunks/ssr/_64e42646._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_64e42646._.js");
      case "server/chunks/ssr/_d25179f9._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_d25179f9._.js");
      case "server/chunks/ssr/_d84836cb._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_d84836cb._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_554ec2bf.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_554ec2bf.js");
      case "server/chunks/ssr/app_b9b1292a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_b9b1292a._.js");
      case "server/chunks/ssr/app_error_tsx_5275429f._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_error_tsx_5275429f._.js");
      case "server/chunks/ssr/app_error_tsx_fee1d43b._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_error_tsx_fee1d43b._.js");
      case "server/chunks/ssr/app_global-error_tsx_9170b7a0._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_global-error_tsx_9170b7a0._.js");
      case "server/chunks/ssr/app_opengraph-image--metadata_348329cc.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_opengraph-image--metadata_348329cc.js");
      case "server/chunks/ssr/node_modules_2d205925._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_2d205925._.js");
      case "server/chunks/ssr/node_modules_5a76c459._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_5a76c459._.js");
      case "server/chunks/ssr/node_modules_67737c43._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_67737c43._.js");
      case "server/chunks/ssr/node_modules_82358ac1._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_82358ac1._.js");
      case "server/chunks/ssr/node_modules_@noble_curves_esm_ed25519_7ded7e67.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@noble_curves_esm_ed25519_7ded7e67.js");
      case "server/chunks/ssr/node_modules_@solana_connector_dist_chunk-DKCZA2QI_mjs_a043b479._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@solana_connector_dist_chunk-DKCZA2QI_mjs_a043b479._.js");
      case "server/chunks/ssr/node_modules_@wallet-standard_app_lib_esm_index_c4172a87.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@wallet-standard_app_lib_esm_index_c4172a87.js");
      case "server/chunks/ssr/node_modules_next_cf02c53c._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_cf02c53c._.js");
      case "server/chunks/ssr/node_modules_next_dist_153caf93._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_153caf93._.js");
      case "server/chunks/ssr/node_modules_next_dist_174ae28d._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_174ae28d._.js");
      case "server/chunks/ssr/node_modules_next_dist_876d3db3._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_876d3db3._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_2fffaa3a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_2fffaa3a._.js");
      case "server/chunks/ssr/node_modules_next_dist_ee586517._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_ee586517._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_3fe9760a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_3fe9760a._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_ca5a7fe0.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_ca5a7fe0.js");
      case "server/chunks/ssr/node_modules_react-icons_io5_index_mjs_14211d88._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_react-icons_io5_index_mjs_14211d88._.js");
      case "server/chunks/ssr/[root-of-the-server]__4a2a7fa6._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__4a2a7fa6._.js");
      case "server/chunks/ssr/_b4d0fc38._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_b4d0fc38._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_copyright_page_actions_041af384.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_copyright_page_actions_041af384.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_15817684.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_15817684.js");
      case "server/chunks/ssr/[root-of-the-server]__74607aae._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__74607aae._.js");
      case "server/chunks/ssr/_b423f669._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_b423f669._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_license_page_actions_51e01c98.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_license_page_actions_51e01c98.js");
      case "server/chunks/ssr/[root-of-the-server]__d7129f2b._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__d7129f2b._.js");
      case "server/chunks/ssr/_8ed98146._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_8ed98146._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_privacy_page_actions_a9d5e861.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_(policies)_privacy_page_actions_a9d5e861.js");
      case "server/chunks/[root-of-the-server]__1133ddb8._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1133ddb8._.js");
      case "server/chunks/[root-of-the-server]__44a4c863._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__44a4c863._.js");
      case "server/chunks/[root-of-the-server]__98d6514a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__98d6514a._.js");
      case "server/chunks/[root-of-the-server]__db2b3a24._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__db2b3a24._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_cf9e715e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_cf9e715e._.js");
      case "server/chunks/_next-internal_server_app_(pages)_[image]_[userDomain]_route_actions_a08487cd.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_(pages)_[image]_[userDomain]_route_actions_a08487cd.js");
      case "server/chunks/ssr/[root-of-the-server]__78819eba._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__78819eba._.js");
      case "server/chunks/ssr/_57cb36a5._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_57cb36a5._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_activations_page_actions_9a956fbe.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_activations_page_actions_9a956fbe.js");
      case "server/chunks/ssr/app_(pages)_activations_6fa463bc._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_activations_6fa463bc._.js");
      case "server/chunks/ssr/node_modules_dc1567bc._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_dc1567bc._.js");
      case "server/chunks/ssr/[root-of-the-server]__48fd31c7._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__48fd31c7._.js");
      case "server/chunks/ssr/_e032bd23._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_e032bd23._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_apps_[package]_page_actions_0307d702.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_apps_[package]_page_actions_0307d702.js");
      case "server/chunks/ssr/app_(pages)_apps_[package]_ClientRedirect_tsx_70df5e63._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_apps_[package]_ClientRedirect_tsx_70df5e63._.js");
      case "server/chunks/ssr/app_(pages)_apps_layout_tsx_79010603._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_apps_layout_tsx_79010603._.js");
      case "server/chunks/ssr/app_(pages)_apps_opengraph-image--metadata_1b01b1d2.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_apps_opengraph-image--metadata_1b01b1d2.js");
      case "server/chunks/ssr/[root-of-the-server]__77b1899e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__77b1899e._.js");
      case "server/chunks/ssr/_200f275d._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_200f275d._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_apps_page_actions_6ad2d335.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_apps_page_actions_6ad2d335.js");
      case "server/chunks/ssr/app_(components)_shared_e046a1f0._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(components)_shared_e046a1f0._.js");
      case "server/chunks/ssr/app_(pages)_apps_a799a48a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_apps_a799a48a._.js");
      case "server/chunks/ssr/[root-of-the-server]__2040a36a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__2040a36a._.js");
      case "server/chunks/ssr/_0fd6ed03._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_0fd6ed03._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_competitors_page_actions_de080636.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_competitors_page_actions_de080636.js");
      case "server/chunks/ssr/app_(pages)_competitors_8d6c1e27._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_competitors_8d6c1e27._.js");
      case "server/chunks/ssr/[root-of-the-server]__33069afb._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__33069afb._.js");
      case "server/chunks/ssr/_3c785926._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_3c785926._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_das_page_actions_57f66c01.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_das_page_actions_57f66c01.js");
      case "server/chunks/ssr/app_6f085d5d._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_6f085d5d._.js");
      case "server/chunks/ssr/[root-of-the-server]__a1ee475e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__a1ee475e._.js");
      case "server/chunks/ssr/_074b9262._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_074b9262._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_explore_page_actions_a75435e8.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_explore_page_actions_a75435e8.js");
      case "server/chunks/ssr/app_(pages)_explore_9e6768e5._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_explore_9e6768e5._.js");
      case "server/chunks/ssr/app_259fdf70._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_259fdf70._.js");
      case "server/chunks/ssr/[root-of-the-server]__665a6c73._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__665a6c73._.js");
      case "server/chunks/ssr/_51bd28ed._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_51bd28ed._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_export_page_actions_8d98406f.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_export_page_actions_8d98406f.js");
      case "server/chunks/ssr/app_6695adcb._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_6695adcb._.js");
      case "server/chunks/ssr/[root-of-the-server]__c9cf8087._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__c9cf8087._.js");
      case "server/chunks/ssr/_8658e213._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_8658e213._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_getdapp_page_actions_c783137a.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_getdapp_page_actions_c783137a.js");
      case "server/chunks/ssr/[root-of-the-server]__7da38803._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__7da38803._.js");
      case "server/chunks/ssr/_769e8132._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_769e8132._.js");
      case "server/chunks/ssr/_93329c48._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_93329c48._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_id_[userDomain]_page_actions_c1ae65b2.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_id_[userDomain]_page_actions_c1ae65b2.js");
      case "server/chunks/ssr/app_3c4934a1._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_3c4934a1._.js");
      case "server/chunks/ssr/node_modules_next_dist_1b775ae0._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1b775ae0._.js");
      case "server/chunks/ssr/[root-of-the-server]__bd24eaa3._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__bd24eaa3._.js");
      case "server/chunks/ssr/_380089dc._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_380089dc._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_lookup_page_actions_157e2bf0.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_lookup_page_actions_157e2bf0.js");
      case "server/chunks/ssr/app_39a7d249._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_39a7d249._.js");
      case "server/chunks/ssr/[root-of-the-server]__f81b1653._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__f81b1653._.js");
      case "server/chunks/ssr/_6d9da9e1._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_6d9da9e1._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_seeker-fund_page_actions_41408acd.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_seeker-fund_page_actions_41408acd.js");
      case "server/chunks/ssr/app_3467d2c7._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_3467d2c7._.js");
      case "server/chunks/ssr/[root-of-the-server]__3ccfd9c0._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__3ccfd9c0._.js");
      case "server/chunks/ssr/_8cafe90e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_8cafe90e._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_skr_page_actions_fc8fe609.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_skr_page_actions_fc8fe609.js");
      case "server/chunks/ssr/app_(pages)_skr_0d43b243._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_skr_0d43b243._.js");
      case "server/chunks/ssr/app_9a29bce3._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_9a29bce3._.js");
      case "server/chunks/ssr/[root-of-the-server]__83aab9fa._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__83aab9fa._.js");
      case "server/chunks/ssr/_ce4ee5b3._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_ce4ee5b3._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_snake_page_actions_41f9fff8.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_snake_page_actions_41f9fff8.js");
      case "server/chunks/ssr/app_(pages)_snake_layout_tsx_14953a20._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_snake_layout_tsx_14953a20._.js");
      case "server/chunks/ssr/app_(pages)_snake_opengraph-image--metadata_423ad035.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_snake_opengraph-image--metadata_423ad035.js");
      case "server/chunks/ssr/app_(pages)_snake_twitter-image--metadata_5adb4d34.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_snake_twitter-image--metadata_5adb4d34.js");
      case "server/chunks/ssr/app_21dfc7bb._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_21dfc7bb._.js");
      case "server/chunks/ssr/[root-of-the-server]__61fdd5b1._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__61fdd5b1._.js");
      case "server/chunks/ssr/_22614dea._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_22614dea._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_sweep_page_actions_6827b95e.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_sweep_page_actions_6827b95e.js");
      case "server/chunks/ssr/app_(pages)_sweep_layout_tsx_f982f63f._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_sweep_layout_tsx_f982f63f._.js");
      case "server/chunks/ssr/app_(pages)_sweep_opengraph-image--metadata_9c8c7f00.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_sweep_opengraph-image--metadata_9c8c7f00.js");
      case "server/chunks/ssr/app_(pages)_sweep_twitter-image--metadata_ec169a25.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_(pages)_sweep_twitter-image--metadata_ec169a25.js");
      case "server/chunks/ssr/app_392c7a2a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_392c7a2a._.js");
      case "server/chunks/ssr/[root-of-the-server]__49c0c7b4._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__49c0c7b4._.js");
      case "server/chunks/ssr/_ac5ae21e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_ac5ae21e._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_usage_page_actions_1442f1ec.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_usage_page_actions_1442f1ec.js");
      case "server/chunks/ssr/node_modules_next_dist_7094cfca._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_7094cfca._.js");
      case "server/chunks/ssr/[root-of-the-server]__7877e316._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__7877e316._.js");
      case "server/chunks/ssr/_3396c2d7._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_3396c2d7._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_whales_page_actions_c81d6e04.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_whales_page_actions_c81d6e04.js");
      case "server/chunks/ssr/[root-of-the-server]__0dbb9ed9._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0dbb9ed9._.js");
      case "server/chunks/ssr/_1d3ba48c._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_1d3ba48c._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_whitepaper_page_actions_ee73a8ea.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_whitepaper_page_actions_ee73a8ea.js");
      case "server/chunks/ssr/app_0647db6d._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_0647db6d._.js");
      case "server/chunks/ssr/[root-of-the-server]__694950aa._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__694950aa._.js");
      case "server/chunks/ssr/_8e526d8c._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_8e526d8c._.js");
      case "server/chunks/ssr/_next-internal_server_app_(pages)_winners_page_actions_1a7612f4.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(pages)_winners_page_actions_1a7612f4.js");
      case "server/chunks/ssr/app_c9a3a1e9._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_c9a3a1e9._.js");
      case "server/chunks/ssr/[root-of-the-server]__e6aa4fb7._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__e6aa4fb7._.js");
      case "server/chunks/ssr/[root-of-the-server]__f62d412e._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__f62d412e._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_75761787.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_75761787.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_ece394eb.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_ece394eb.js");
      case "server/chunks/ssr/node_modules_next_dist_f183c70b._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_f183c70b._.js");
      case "server/chunks/[root-of-the-server]__a001c37c._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__a001c37c._.js");
      case "server/chunks/_de7e8893._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_de7e8893._.js");
      case "server/chunks/_next-internal_server_app_api_activations_route_actions_1d6bca97.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_activations_route_actions_1d6bca97.js");
      case "server/chunks/node_modules_b303ffd8._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/node_modules_b303ffd8._.js");
      case "server/chunks/[root-of-the-server]__1ff56b18._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1ff56b18._.js");
      case "server/chunks/_next-internal_server_app_api_allocation_[wallet]_route_actions_882a4972.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_allocation_[wallet]_route_actions_882a4972.js");
      case "server/chunks/[root-of-the-server]__afed48b8._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__afed48b8._.js");
      case "server/chunks/_next-internal_server_app_api_competitors_route_actions_03998c57.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_competitors_route_actions_03998c57.js");
      case "server/chunks/[root-of-the-server]__59776eaa._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__59776eaa._.js");
      case "server/chunks/_next-internal_server_app_api_cron_usage_route_actions_7d3623aa.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_cron_usage_route_actions_7d3623aa.js");
      case "server/chunks/[root-of-the-server]__ce701af7._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__ce701af7._.js");
      case "server/chunks/_next-internal_server_app_api_dappstore_route_actions_a5f098d0.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_dappstore_route_actions_a5f098d0.js");
      case "server/chunks/[root-of-the-server]__c67f2e41._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__c67f2e41._.js");
      case "server/chunks/_next-internal_server_app_api_das_route_actions_af9a92d0.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_das_route_actions_af9a92d0.js");
      case "server/chunks/[root-of-the-server]__80512c3a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__80512c3a._.js");
      case "server/chunks/_next-internal_server_app_api_debug_route_actions_b5c5d44b.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_debug_route_actions_b5c5d44b.js");
      case "server/chunks/_next-internal_server_app_api_export_route_actions_47bc2a74.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_export_route_actions_47bc2a74.js");
      case "server/chunks/node_modules_25a5b89f._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/node_modules_25a5b89f._.js");
      case "server/chunks/[root-of-the-server]__fe3df557._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__fe3df557._.js");
      case "server/chunks/_next-internal_server_app_api_lookup_route_actions_7b69b1b2.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_lookup_route_actions_7b69b1b2.js");
      case "server/chunks/[root-of-the-server]__e77515cd._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__e77515cd._.js");
      case "server/chunks/_next-internal_server_app_api_skr_report_route_actions_a2a20506.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_skr_report_route_actions_a2a20506.js");
      case "server/chunks/[root-of-the-server]__f9b26dee._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f9b26dee._.js");
      case "server/chunks/_next-internal_server_app_api_skr_stakers_route_actions_34c6f62a.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_skr_stakers_route_actions_34c6f62a.js");
      case "server/chunks/[root-of-the-server]__ac652cd3._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__ac652cd3._.js");
      case "server/chunks/_next-internal_server_app_api_skr_summary_route_actions_0a7de611.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_skr_summary_route_actions_0a7de611.js");
      case "server/chunks/[root-of-the-server]__ff562552._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__ff562552._.js");
      case "server/chunks/_next-internal_server_app_api_skr_vault_route_actions_30741de8.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_skr_vault_route_actions_30741de8.js");
      case "server/chunks/[root-of-the-server]__29ed5405._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__29ed5405._.js");
      case "server/chunks/_next-internal_server_app_api_snake_config_route_actions_bc529832.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_snake_config_route_actions_bc529832.js");
      case "server/chunks/[root-of-the-server]__cd20f6dd._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__cd20f6dd._.js");
      case "server/chunks/_next-internal_server_app_api_snake_leaderboard_route_actions_5b03a2cf.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_snake_leaderboard_route_actions_5b03a2cf.js");
      case "server/chunks/[root-of-the-server]__689b4513._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__689b4513._.js");
      case "server/chunks/_next-internal_server_app_api_snake_prize_route_actions_5f3a3297.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_snake_prize_route_actions_5f3a3297.js");
      case "server/chunks/[root-of-the-server]__e261a6e0._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__e261a6e0._.js");
      case "server/chunks/_next-internal_server_app_api_sweep_contestants_route_actions_e875f203.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_sweep_contestants_route_actions_e875f203.js");
      case "server/chunks/[root-of-the-server]__b619007c._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__b619007c._.js");
      case "server/chunks/_next-internal_server_app_api_usage_route_actions_9f13182a.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_usage_route_actions_9f13182a.js");
      case "server/chunks/[root-of-the-server]__3e40c974._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__3e40c974._.js");
      case "server/chunks/_next-internal_server_app_favicon_ico_route_actions_353150a5.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_favicon_ico_route_actions_353150a5.js");
      case "server/chunks/node_modules_next_dist_esm_build_templates_app-route_d6a474cc.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/node_modules_next_dist_esm_build_templates_app-route_d6a474cc.js");
      case "server/chunks/ssr/[root-of-the-server]__be725356._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__be725356._.js");
      case "server/chunks/ssr/_7b130b15._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_7b130b15._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_39d4fc33.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_39d4fc33.js");
      case "server/chunks/ssr/app_73f5de43._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_73f5de43._.js");
      case "server/chunks/ssr/app_e715519a._.js": return require("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/.next/server/chunks/ssr/app_e715519a._.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {
      case "/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/node_modules/next/dist/compiled/@vercel/og/resvg.wasm": return (await import("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/node_modules/next/dist/compiled/@vercel/og/resvg.wasm")).default;
      case "/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/node_modules/next/dist/compiled/@vercel/og/yoga.wasm": return (await import("/Volumes/PRO-G40/SEEKERTRACKER/website-seekertracker/.open-next/server-functions/default/node_modules/next/dist/compiled/@vercel/og/yoga.wasm")).default;
      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
