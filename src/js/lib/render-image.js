"use strict";
/*!
 * Copyright (c) 2013-2014 9elements GmbH
 *
 * Released under Attribution-NonCommercial 3.0 Unported
 * http://creativecommons.org/licenses/by-nc/3.0/
 *
 * For commercial use, please contact us at contact@9elements.com
 */
import bluebird from "bluebird";
import ImageDimensions from "./image-dimensions";
import Vector2 from "./math/vector2";
import CanvasRenderer from "../renderers/canvas-renderer";
import WebGLRenderer from "../renderers/webgl-renderer";

/**
 * Handles the image rendering process
 * @class
 * @alias ImglyKit.RenderImage
 * @param {Image} image
 * @param {Array.<ImglyKit.Operation>} operationsStack
 * @param {string} dimensions
 * @param {string} preferredRenderer
 * @private
 */
class RenderImage {
  constructor (image, operationsStack, dimensions, preferredRenderer) {
    /**
     * @type {Object}
     * @private
     */
    this._options = {
      preferredRenderer: preferredRenderer
    };

    /**
     * @type {Boolean}
     * @private
     * @default false
     */
    this._webglEnabled = false;

    /**
     * @type {Renderer}
     * @private
     */
    this._renderer = null;

    /**
     * @type {Image}
     * @private
     */
    this._image = image;

    /**
     * @type {Array.<ImglyKit.Operation>}
     * @private
     */
    this._stack = operationsStack;

    /**
     * @type {ImglyKit.ImageDimensions}
     * @private
     */
    this._dimensions = new ImageDimensions(dimensions);

    /**
     * @type {Vector2}
     * @private
     */
    this._initialDimensions = new Vector2(this._image.width, this._image.height);

    this._initRenderer();
  }

  /**
   * Creates a renderer (canvas or webgl, depending on support)
   * @return {Promise}
   * @private
   */
  _initRenderer () {
    /* istanbul ignore if */
    if (WebGLRenderer.isSupported() && this._options.preferredRenderer !== "canvas") {
      this._renderer = new WebGLRenderer(this._initialDimensions);
      this._webglEnabled = true;
    } else if (CanvasRenderer.isSupported()) {
      this._renderer = new CanvasRenderer(this._initialDimensions);
      this._webglEnabled = false;
    }

    /* istanbul ignore if */
    if (this._renderer === null) {
      throw new Error("Neither Canvas nor WebGL renderer are supported.");
    }

    this._renderer.drawImage(this._image);
  }

  /**
   * Renders the image
   * @return {Promise}
   */
  render () {
    var self = this;
    return bluebird
      .map(this._stack, function (operation) {
        return operation.validateSettings();
      })
      .then(function () {
        return bluebird.map(self._stack, function (operation) {
          return operation.render(self._renderer);
        }, { concurrency: 1 }).then(function () {
          return self._renderer.renderFinal();
        });
      })
      .then(function () {
        var initialSize = self._renderer.getSize();
        var finalDimensions = self._dimensions.calculateFinalDimensions(initialSize);

        if (finalDimensions.equals(initialSize)) {
          // No need to resize
          return;
        }

        return self._renderer.resizeTo(finalDimensions);
      });
  }

  /**
   * Returns the renderer
   * @return {Renderer}
   */
  getRenderer () {
    return this._renderer;
  }
}

export default RenderImage;
