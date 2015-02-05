"use strict";
/*!
 * Copyright (c) 2013-2015 9elements GmbH
 *
 * Released under Attribution-NonCommercial 3.0 Unported
 * http://creativecommons.org/licenses/by-nc/3.0/
 *
 * For commercial use, please contact us at contact@9elements.com
 */
import Renderer from "./renderer";

/**
 * @class
 * @alias ImglyKit.CanvasRenderer
 * @extends {ImglyKit.Renderer}
 * @private
 */
class CanvasRenderer extends Renderer {
  /**
   * A unique string that identifies this renderer
   * @type {String}
   */
  static get identifier () {
    return "canvas";
  }

  /**
   * Checks whether this type of renderer is supported in the current environment
   * @abstract
   * @returns {boolean}
   */
  static isSupported () {
    var elem = this.prototype.createCanvas();
    return !!(elem.getContext && elem.getContext("2d"));
  }

  /**
   * Gets the rendering context from the Canva
   * @return {RenderingContext}
   * @abstract
   */
  _getContext () {
    /* istanbul ignore next */
    return this._canvas.getContext("2d");
  }

  /**
   * Draws the given image on the canvas
   * @param  {Image} image
   */
  drawImage (image) {
    this._context.drawImage(image, 0, 0, image.width, image.height, 0, 0, this._canvas.width, this._canvas.height);
  }

  /**
   * Resizes the current canvas picture to the given dimensions
   * @param  {Vector2} dimensions
   * @return {Promise}
   */
  resizeTo (dimensions) {
    // Create a temporary canvas to draw to
    var newCanvas = this.createCanvas();
    newCanvas.width = dimensions.x;
    newCanvas.height = dimensions.y;
    var newContext = newCanvas.getContext("2d");

    // Draw the source canvas onto the new one
    newContext.drawImage(this._canvas,
      0, 0,
      this._canvas.width,
      this._canvas.height,
      0, 0,
      newCanvas.width,
      newCanvas.height);

    // Set the new canvas and context
    this.setCanvas(newCanvas);
  }

  /**
   * Returns a cloned version of the current canvas
   * @return {Canvas}
   */
  cloneCanvas () {
    var canvas = this.createCanvas();
    var context = canvas.getContext("2d");

    // Resize the canvas
    canvas.width = this._canvas.width;
    canvas.height = this._canvas.height;

    // Draw the current canvas on the new one
    context.drawImage(this._canvas, 0, 0);

    return canvas;
  }
}

export default CanvasRenderer;
