"use strict";
/*!
 * Copyright (c) 2013-2015 9elements GmbH
 *
 * Released under Attribution-NonCommercial 3.0 Unported
 * http://creativecommons.org/licenses/by-nc/3.0/
 *
 * For commercial use, please contact us at contact@9elements.com
 */

import _ from "lodash";
import bluebird from "bluebird";
import RenderImage from "./lib/render-image";
import ImageExporter from "./lib/image-exporter";
import { RenderType, ImageFormat } from "./constants";
import Utils from "./lib/utils";

// Default UIs
import NightUI from "./ui/night/ui";

// Don't catch errors
bluebird.onPossiblyUnhandledRejection((error) => { throw error; });

/**
 * @class
 * @param {Object} options
 * @param {HTMLElement} [options.container] - Specifies where the UI should be
 *                                          added to. If none is given, the UI
 *                                          will automatically be disabled.
 * @param {Image} options.image - The source image
 */
class ImglyKit {
  constructor (options) {

    // `options` is required
    if (typeof options === "undefined") throw new Error("No options given.");

    // Set default options
    options = _.defaults(options, {
      assetsUrl: "assets",
      container: null,
      ui: true
    });

    /**
     * @type {Object}
     * @private
     */
    this._options = options;

    /**
     * The stack of {@link Operation} instances that will be used
     * to render the final Image
     * @type {Array.<ImglyKit.Operation>}
     */
    this.operationsStack = [];

    /**
     * The registered UI types that can be selected via the `ui` option
     * @type {Object.<String, UI>}
     * @private
     */
    this._registeredUIs = {};

    // Register the default UIs
    this._registerUIs();

    /**
     * The registered operations
     * @type {Object.<String, ImglyKit.Operation>}
     */
    this._registeredOperations = {};

    // Register the default operations
    this._registerOperations();

    if (this._options.ui) {
      this._initUI();
    }
  }

  /**
   * Renders the image
   * @param  {ImglyKit.RenderType} [renderType=ImglyKit.RenderType.DATA_URL] - The output type
   * @param  {ImglyKit.ImageFormat} [imageFormat=ImglyKit.ImageFormat.PNG] - The output image format
   * @param  {string} [dimensions] - The final dimensions of the image
   * @return {Promise}
   */
  render (renderType, imageFormat, dimensions) {
    // `options.image` is required
    if (typeof this._options.image === "undefined") throw new Error("`options.image` is undefined.");

    var settings = ImageExporter.validateSettings(renderType, imageFormat);

    renderType = settings.renderType;
    imageFormat = settings.imageFormat;

    // Create a RenderImage
    var renderImage = new RenderImage(this._options.image, this.operationsStack, dimensions, this._options.renderer);

    // Initiate image rendering
    return renderImage.render()
      .then(function () {
        var canvas = renderImage.getRenderer().getCanvas();
        return ImageExporter.export(canvas, renderType, imageFormat);
      });
  }

  /**
   * Resets all custom and selected operations
   */
  reset () {

  }

  /**
   * Returns the asset path for the given filename
   * @param  {String} asset
   * @return {String}
   */
  getAssetPath (asset) {
    var isBrowser = typeof window !== "undefined";
    if (isBrowser) {
      /* istanbul ignore next */
      return this._options.assetsUrl + "/" + asset;
    } else {
      var path = require("path");
      return path.resolve(this._options.assetsUrl, asset);
    }
  }

  /**
   * Registers all default UIs
   * @private
   */
  _registerUIs () {
    this.registerUI(NightUI);
  }

  /**
   * Registers all default operations
   * @private
   */
  _registerOperations () {
    for (let operationName in ImglyKit.Operations) {
      this.registerOperation(ImglyKit.Operations[operationName]);
    }
  }

  /**
   * Registers the given operation
   * @param {ImglyKit.Operation} operation - The operation class
   */
  registerOperation (operation) {
    this._registeredOperations[operation.prototype.identifier] = operation;
  }

  /**
   * Registers the given UI
   * @param {UI} ui
   */
  registerUI (ui) {
    this._registeredUIs[ui.prototype.identifier] = ui;
  }

  /**
   * Initializes the UI
   * @private
   */
  /* istanbul ignore next */
  _initUI () {
    var UI;

    if (this._options.ui === true) {
      // Select the first UI by default
      UI = Utils.values(this._registeredUIs)[0];
    } else {
      // Select the UI with the given identifier
      UI = this._registeredUIs[this._options.ui];
    }

    // Check if UI exists
    if (typeof UI === "undefined") {
      throw new Error("ImglyKit: Unknown UI: " + this._options.ui);
    }

    /**
     * @type {ImglyKit.UI}
     */
    this.ui = new UI(this, this._options);
  }

  get registeredOperations () {
    return this._registeredOperations;
  }

  run () {
    this.ui.run();
  }
}

/**
 * The current version of the SDK
 * @name ImglyKit.version
 * @internal Keep in sync with package.json
 */
ImglyKit.version = "0.0.1";

// Exposed classes
ImglyKit.RenderImage = RenderImage;
ImglyKit.Color = require("./lib/color");
ImglyKit.Operation = require("./operations/operation");
ImglyKit.Operations = {};
ImglyKit.Operations.FiltersOperation = require("./operations/filters-operation");
ImglyKit.Operations.RotationOperation = require("./operations/rotation-operation");
ImglyKit.Operations.CropOperation = require("./operations/crop-operation");
ImglyKit.Operations.SaturationOperation = require("./operations/saturation-operation");
ImglyKit.Operations.ContrastOperation = require("./operations/contrast-operation");
ImglyKit.Operations.BrightnessOperation = require("./operations/brightness-operation");
ImglyKit.Operations.FlipOperation = require("./operations/flip-operation");
ImglyKit.Operations.TiltShiftOperation = require("./operations/tilt-shift-operation");
ImglyKit.Operations.RadialBlurOperation = require("./operations/radial-blur-operation");
ImglyKit.Operations.TextOperation = require("./operations/text-operation");
ImglyKit.Operations.StickersOperation = require("./operations/stickers-operation");
ImglyKit.Operations.FramesOperation = require("./operations/frames-operation");

// Exposed constants
ImglyKit.RenderType = RenderType;
ImglyKit.ImageFormat = ImageFormat;
ImglyKit.Vector2 = require("./lib/math/vector2");

export default ImglyKit;
