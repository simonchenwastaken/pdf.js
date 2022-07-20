/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./interfaces").IDownloadManager} IDownloadManager */
/** @typedef {import("./interfaces").IL10n} IL10n */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */

import { AnnotationLayer } from "pdfjs-lib";
import { NullL10n } from "./l10n_utils.js";

/**
 * @typedef {Object} AnnotationLayerBuilderOptions
 * @property {HTMLDivElement} pageDiv
 * @property {PDFPageProxy} pdfPage
 * @property {AnnotationStorage} [annotationStorage]
 * @property {string} [imageResourcesPath] - Path for image resources, mainly
 *   for annotation icons. Include trailing slash.
 * @property {boolean} renderForms
 * @property {IPDFLinkService} linkService
 * @property {IDownloadManager} downloadManager
 * @property {IL10n} l10n - Localization service.
 * @property {boolean} [enableScripting]
 * @property {Promise<boolean>} [hasJSActionsPromise]
 * @property {Promise<Object<string, Array<Object>> | null>}
 *   [fieldObjectsPromise]
 * @property {Object} [mouseState]
 * @property {Map<string, HTMLCanvasElement>} [annotationCanvasMap]
 */

class AnnotationLayerBuilder {
  /**
   * @param {AnnotationLayerBuilderOptions} options
   */
  constructor({
    pageDiv,
    pdfPage,
    linkService,
    downloadManager,
    annotationStorage = null,
    imageResourcesPath = "",
    renderForms = true,
    l10n = NullL10n,
    enableScripting = false,
    hasJSActionsPromise = null,
    fieldObjectsPromise = null,
    mouseState = null,
    annotationCanvasMap = null,
  }) {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.linkService = linkService;
    this.downloadManager = downloadManager;
    this.imageResourcesPath = imageResourcesPath;
    this.renderForms = renderForms;
    this.l10n = l10n;
    this.annotationStorage = annotationStorage;
    this.enableScripting = enableScripting;
    this._hasJSActionsPromise = hasJSActionsPromise;
    this._fieldObjectsPromise = fieldObjectsPromise;
    this._mouseState = mouseState;
    this._annotationCanvasMap = annotationCanvasMap;

    this.div = null;
    this._cancelled = false;
  }

  /**
   * @param {PageViewport} viewport
   * @param {string} intent (default value is 'display')
   * @returns {Promise<void>} A promise that is resolved when rendering of the
   *   annotations is complete.
   */
  async render(viewport, intent = "display") {
    const [annotations, hasJSActions = false, fieldObjects = null] =
      await Promise.all([
        this.pdfPage.getAnnotations({ intent }),
        this._hasJSActionsPromise,
        this._fieldObjectsPromise,
      ]);

    if (this._cancelled || annotations.length === 0) {
      return;
    }

    const parameters = {
      viewport: viewport.clone({ dontFlip: true }),
      div: this.div,
      annotations,
      page: this.pdfPage,
      imageResourcesPath: this.imageResourcesPath,
      renderForms: this.renderForms,
      linkService: this.linkService,
      downloadManager: this.downloadManager,
      annotationStorage: this.annotationStorage,
      enableScripting: this.enableScripting,
      hasJSActions,
      fieldObjects,
      mouseState: this._mouseState,
      annotationCanvasMap: this._annotationCanvasMap,
    };

    if (this.div) {
      // If an annotationLayer already exists, refresh its children's
      // transformation matrices.
      console.log('im heree now')
      AnnotationLayer.setDimensions(this.div, viewport);
      AnnotationLayer.update(parameters);
    } else {
      // Create an annotation layer div and render the annotations
      // if there is at least one annotation.
      this.div = document.createElement("div");
      AnnotationLayer.setDimensions(this.div, viewport);

      this.div.className = "annotationLayer";
      this.pageDiv.append(this.div);
      parameters.div = this.div;

      AnnotationLayer.render(parameters);
      this.l10n.translate(this.div);
    }
  }

  logInToFlow = async (event) => {
    let params = {
      "grant_type": "password",
      "username": "support@verto.ca",
      "password": "temppass"
    }
    const response = await fetch("http://localhost:3000/oauth/token", {
      method: 'post',
      body: JSON.stringify(params),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
    .then(res => res.json())
    .then(json => {
      return json.access_token
    })
    return response
  }

  static async getParams(access_token){
    const pdfPage = await pdfDoc.getPage(1);
    console.log('kjsdbvkjsdfb',pdfPage)
    AnnotationLayer.render(access_token, 'update');
    // const queryString = window.location.search;
    // const urlParams = new URLSearchParams(queryString);
    // let response = await fetch("http://localhost:3000/api/v1/encounters/1/forms/" + urlParams.get('id'), {
    //       method: 'get',
    //       headers: new Headers({
    //         'Authorization': 'Bearer '+ access_token,
    //         'Content-Type': 'application/json'
    //       })
    //     })
    //     .then(response => response.json())
    //     .then(json => {
    //       return json.fields
    // })
    // return response
  }

  cancel() {
    this._cancelled = true;
  }

  hide() {
    if (!this.div) {
      return;
    }
    this.div.hidden = true;
  }
}

export { AnnotationLayerBuilder };
