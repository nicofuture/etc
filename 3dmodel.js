function hideLoader() {
  let loading = document.querySelector(".loading");
  loading.style.display = "none";
}

let animationID;
let idleAnimation;
let timerId;

const MAP_NAMES = [
  "map",
  "aoMap",
  "emissiveMap",
  "glossinessMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularMap"
];

class Viewer {
  constructor(el) {
    this.el = el;
    // this.options = options;

    this.lights = [];
    this.content = null;

    this.state = {
      playbackSpeed: 1.0,
      actionStates: {},
      wireframe: false,
      skeleton: false,
      grid: false,

      // Lights
      addLights: true,
      exposure: 1.0,
      textureEncoding: "sRGB"
    };

    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color(0xffffff);

    const fov = 45;
    this.defaultCamera = new THREE.PerspectiveCamera(
      fov,
      el.clientWidth / el.clientHeight,
      0.01,
      1000
    );

    this.activeCamera = this.defaultCamera;

    this.renderer = window.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.physicallyCorrectLights = true;
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(el.clientWidth, el.clientHeight);

    this.controls = new THREE.OrbitControls(
      this.activeCamera,
      this.renderer.domElement
    );
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = -10;
    this.controls.screenSpacePanning = true;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;

    this.animFolder = null;
    this.animCtrls = [];
    this.morphFolder = null;
    this.morphCtrls = [];
    this.skeletonHelpers = [];
    this.gridHelper = null;
    this.axesHelper = null;

    this.resize();

    this.setControlsListener();
    window.addEventListener("resize", this.resize.bind(this), false);
  }

  setControlsListener() {
    this.controls.addEventListener("change", () => {
      restartTimer();
      this.render();
    });
  }

  render() {
    this.renderer.render(this.scene, this.activeCamera);
  }

  resize() {
    const { clientHeight, clientWidth } = this.el.parentElement;

    this.activeCamera.aspect = clientWidth / clientHeight;
    this.activeCamera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);

    if (this.content) {
      const box = new THREE.Box3().setFromObject(this.content);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.activeCamera.fov * (Math.PI / 180);

      var coeff = 1;

      let cameraZ =
        maxDim / coeff / Math.tan((fov * this.activeCamera.aspect) / 2);

      console.log(cameraZ);

      this.activeCamera.position.z = cameraZ;

      this.activeCamera.updateProjectionMatrix();
    }

    // if (clientWidth < 768) {
    //   this.defaultCamera.zoom = 2;
    //   this.defaultCamera.updateProjectionMatrix();
    // } else if (clientWidth < 1025) {
    //   this.defaultCamera.zoom = 5;
    //   this.defaultCamera.updateProjectionMatrix();
    // }

    this.render();
  }

  load(url) {
    // Load.
    return new Promise((resolve, reject) => {
      let manager = new THREE.LoadingManager();

      manager.onLoad = function() {
        hideLoader();
      };

      const loader = new THREE.GLTFLoader(manager);
      loader.setCrossOrigin("anonymous");

      loader.load(url, gltf => {
        const scene = gltf.scene || gltf.scenes[0];
        const clips = gltf.animations || [];

        this.setContent(scene, clips);

        resolve(gltf);
      });
    });
  }

  /**
   * @param {THREE.Object3D} object
   * @param {Array<THREE.AnimationClip} clips
   */
  setContent(object) {
    object.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    this.size = size;

    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;
    object.rotation.y -= Math.PI / 2;

    this.controls.maxDistance = size * 10;
    this.defaultCamera.near = 0.1;
    this.defaultCamera.far = 1000;
    this.defaultCamera.updateProjectionMatrix();

    this.defaultCamera.position.copy(center);
    this.defaultCamera.position.x = 0;
    this.defaultCamera.position.y = 0;
    this.defaultCamera.position.z = 0;

    this.content = object;

    this.setCamera(center);
    this.activeCamera.lookAt(this.content);

    // this.controls.saveState();
    this.controls.object = this.activeCamera;
    this.controls.enableZoom = false;
    this.controls.update();

    this.scene.add(this.content);
    console.log(this.scene, "scene");
    this.activeCamera.zoom = 1;
    this.scene.add(this.activeCamera);

    this.updateTextureEncoding();
    this.activeCamera.updateProjectionMatrix();
    window.content = this.content;
    this.el.appendChild(this.renderer.domElement);
    this.resize();

    let render = this.render.bind(this);

    idleAnimation = function() {
      animationID = requestAnimationFrame(function animation(time) {
        object.rotation.y += Math.PI / 5000;

        render();

        animationID = requestAnimationFrame(animation);
      });
    };

    idleAnimation();
  }

  printGraph(node) {
    console.group(" <" + node.type + "> " + node.name);
    node.children.forEach(child => this.printGraph(child));
    console.groupEnd();
  }

  /**
   * @param {string} name
   */
  setCamera(center) {
    this.content.traverse(node => {
      if (node instanceof THREE.PerspectiveCamera) {
        this.activeCamera = node;
        console.log(this.activeCamera.position);
        console.log(this.activeCamera);
        this.activeCamera.castShadow = true;
      }
    });

    const { clientHeight, clientWidth } = this.el.parentElement;

    this.activeCamera.aspect = clientWidth / clientHeight;
  }

  updateTextureEncoding() {
    const encoding =
      this.state.textureEncoding === "sRGB"
        ? THREE.sRGBEncoding
        : THREE.LinearEncoding;
    traverseMaterials(this.content, material => {
      if (material.map) material.map.encoding = encoding;
      if (material.emissiveMap) material.emissiveMap.encoding = encoding;
      if (material.map || material.emissiveMap) material.needsUpdate = true;
    });
  }
}

function traverseMaterials(object, callback) {
  object.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    materials.forEach(callback);
  });
}

function restartTimer() {
  cancelAnimationFrame(animationID);
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    idleAnimation();
  }, 3000);
}

// export function stopAnimation() {
//     cancelAnimationFrame(animationID);
//     clearTimeout(timerId);
// }

let el = document.querySelector(".canvas");
let viewer = new Viewer(el);

viewer
  .load("https://seekingmaya.github.io/etc-content/assets/model.glb")
  .catch(e => console.log(e))
  .then(gltf => console.log("Done ", gltf));
