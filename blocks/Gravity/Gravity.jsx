'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Image from 'next/image';

const MAX_ASSETS = 17;

const CONFIG = {
  gravity: 0.9,
  maxVelocity: 22,

  mouseStrength: 1.8,
  mouseRadius: 190,

  airFriction: 0.995,

  floorBounce: 0.42,
  sideBounce: 0.5,

  collisionBounce: 0.5,
  collisionRadiusMultiplier: 0.38,

  rotationFriction: 0.92,
  rotationStrength: 0.018,

  drift: 0.035,

  minScale: 0.88,
  maxScale: 1.04,

  introDuration: 0.8,
  introStagger: 0.04,

  dragVelocityMultiplier: 1.25,
  maxDragVelocity: 30,

  dragScale: 1.05,
  dragScaleDuration: 0.12,
};

//mix the items avails
function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function getUniqueAssets(assets) {
  return [...new Set(assets)];
}

function selectAssets(assets) {
  const uniqueAssets = getUniqueAssets(assets);

  return shuffle(uniqueAssets).slice(
    0,
    MAX_ASSETS
  );
}


export default function Gravity({
  assets = [],
}) {

  const fieldRef = useRef(null);
  const introRef = useRef(null);


  useEffect(() => {

    const field = fieldRef.current;

    if (!field) {
      return;
    }


    const selectedAssets = selectAssets(assets);


    if (!selectedAssets.length) {
      return;
    }

    field.innerHTML = '';


    selectedAssets.forEach(
      (src, index) => {

        const artifact = document.createElement('div');

        artifact.className = 'absolute left-0 top-0 select-none';

        artifact.dataset.index = index;


        const inner = document.createElement('div');
        inner.className = 'origin-center will-change-transform';


        const image = document.createElement('img');

        image.className = 'block h-auto w-auto max-h-[150px] max-w-[150px] object-contain select-none';

        image.src = src;

        image.alt = '';

        image.draggable = false;

        inner.appendChild(image);

        artifact.appendChild(inner);

        field.appendChild(artifact);

      }
    );


    const artifactElements = Array.from(field.children);


    if (!artifactElements.length) {
      return;
    }

    let objects = [];

    let fieldWidth = 0;

    let fieldHeight = 0;

    let fieldRect = null;

    let animationFrame = null;

    let resizeTimer = null;

    let lastTime = performance.now();

    let isVisible = !document.hidden;

    let drag = null;


    let mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const clamp = (
      value,
      min,
      max
    ) => {

      return Math.max(
        min,
        Math.min(
          max,
          value
        )
      );

    };


    const random = (min, max) => {

      return (min + Math.random() * (max - min));

    };

    //size of device
    const measureField = () => {

      fieldRect = field.getBoundingClientRect();

      fieldWidth = fieldRect.width;

      fieldHeight = fieldRect.height;

    };

    const getFieldPosition = (clientX, clientY) => {

      if (!fieldRect) {
        measureField();
      }

      return {
        x: clientX - fieldRect.left,
        y: clientY - fieldRect.top,
      };

    };


    const renderObject = (object) => {

      object.element.style.transform =
        `translate3d(${object.x}px, ${object.y}px, 0)
        rotate(${object.rotation}deg)`;
    };

    const renderAll = () => {

      objects.forEach(
        renderObject
      );

    };

    const createObjects = () => {

      measureField();
      objects = [];

      artifactElements.forEach((element) => {
        const image = element.querySelector('img');

        const inner = element.firstElementChild;

        const width = image.offsetWidth || 100;
        const height = image.offsetHeight || 100;

        const scale = random(CONFIG.minScale, CONFIG.maxScale);
        const mass = random(0.75, 1.35);

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        const x = random(0, Math.max(0, fieldWidth - scaledWidth));
        const y = random(-250, Math.min(150, fieldHeight * 0.15));

        const object = {
          element,
          inner,
          width: scaledWidth,
          height: scaledHeight,
          x, y,
          vx: random(-1.5, 1.5),
          vy: random(0, 2),
          rotation: random(-12, 12),
          rotationVelocity: random(-1.5, 1.5),
          scale,
          mass,
          dragging: false,
        };


        objects.push(object);

        //adds gravity to the image
        renderObject(object);

        inner.style.transform = 'scale(0)';

      }
      );

    };

    const animateIn = () => {
      objects.forEach((object, index) => {
        gsap.to(object.inner,
          {
            scale: object.scale,
            duration: CONFIG.introDuration,
            delay: index * CONFIG.introStagger,
            ease: 'back.out(1.5)',
          }
        );
      });
    };


    const updatePointerPosition = (event) => {

      const position =
        getFieldPosition(
          event.clientX,
          event.clientY
        );


      mouse.x =
        position.x;

      mouse.y =
        position.y;

      mouse.active =
        true;


      return position;

    };

    const applyMouseForce = (
      object,
      delta
    ) => {

      if (
        !mouse.active ||
        object.dragging
      ) {

        return;

      }


      const centerX =
        object.x +
        object.width * 0.5;

      const centerY =
        object.y +
        object.height * 0.5;


      const dx =
        centerX -
        mouse.x;

      const dy =
        centerY -
        mouse.y;


      const distanceSquared =
        dx * dx +
        dy * dy;


      const radius =
        CONFIG.mouseRadius;


      if (
        distanceSquared <= 0 ||
        distanceSquared >
        radius * radius
      ) {

        return;

      }


      const distance =
        Math.sqrt(
          distanceSquared
        );


      const normalizedX =
        dx / distance;

      const normalizedY =
        dy / distance;


      const falloff =
        1 -
        distance / radius;


      const force =
        CONFIG.mouseStrength *
        falloff *
        falloff *
        delta *
        60;


      object.vx +=
        normalizedX *
        force /
        object.mass;


      object.vy +=
        normalizedY *
        force /
        object.mass;


      object.rotationVelocity +=
        normalizedX *
        force *
        CONFIG.rotationStrength;

    };

    //moviing mouse handler
    const handlePointerMove = (
      event
    ) => {

      if (
        drag &&
        event.pointerId !==
        drag.pointerId
      ) {

        return;

      }


      const position =
        updatePointerPosition(
          event
        );


      if (!drag) {
        return;
      }


      event.preventDefault();


      const object =
        drag.object;


      const now =
        performance.now();


      const dt =
        Math.max(
          0.001,
          (
            now -
            drag.lastTime
          ) / 1000
        );


      const newX =
        position.x -
        drag.offsetX;


      const newY =
        position.y -
        drag.offsetY;


      const velocityX =
        (
          newX -
          object.x
        ) /
        (
          dt * 60
        );


      const velocityY =
        (
          newY -
          object.y
        ) /
        (
          dt * 60
        );


      object.vx =
        clamp(
          velocityX,
          -CONFIG.maxDragVelocity,
          CONFIG.maxDragVelocity
        );


      object.vy =
        clamp(
          velocityY,
          -CONFIG.maxDragVelocity,
          CONFIG.maxDragVelocity
        );


      object.x =
        newX;

      object.y =
        newY;


      object.rotationVelocity +=
        object.vx * 0.08;


      drag.lastX =
        position.x;

      drag.lastY =
        position.y;

      drag.lastTime =
        now;


      renderObject(
        object
      );

    };


    const startDrag = (
      event,
      object
    ) => {

      if (
        drag ||
        !object
      ) {

        return;

      }


      if (
        event.pointerType === 'mouse' &&
        event.button !== 0
      ) {

        return;

      }


      event.preventDefault();


      const position =
        updatePointerPosition(
          event
        );


      try {

        event.target.setPointerCapture(
          event.pointerId
        );

      } catch {
        // Safe fallback.
      }


      drag = {

        object,

        pointerId:
          event.pointerId,

        offsetX:
          position.x -
          object.x,

        offsetY:
          position.y -
          object.y,

        lastX:
          position.x,

        lastY:
          position.y,

        lastTime:
          performance.now(),

      };


      object.dragging =
        true;


      object.element.classList.add(
        'is-dragging'
      );


      object.element.style.zIndex =
        '100';


      gsap.killTweensOf(
        object.inner
      );


      gsap.to(
        object.inner,
        {

          scale:
            object.scale *
            CONFIG.dragScale,

          duration:
            CONFIG.dragScaleDuration,

          ease:
            'power2.out',

        }
      );


      renderObject(
        object
      );

    };


    const endDrag = (
      event
    ) => {

      if (!drag) {
        return;
      }


      if (
        event &&
        drag.pointerId !==
        event.pointerId
      ) {

        return;

      }


      const object =
        drag.object;


      object.dragging =
        false;


      object.element.classList.remove(
        'is-dragging'
      );


      object.element.style.zIndex =
        '1';


      object.vx *=
        CONFIG.dragVelocityMultiplier;

      object.vy *=
        CONFIG.dragVelocityMultiplier;


      object.vx =
        clamp(
          object.vx,
          -CONFIG.maxVelocity,
          CONFIG.maxVelocity
        );

      object.vy =
        clamp(
          object.vy,
          -CONFIG.maxVelocity,
          CONFIG.maxVelocity
        );


      gsap.to(
        object.inner,
        {

          scale:
            object.scale,

          duration:
            0.18,

          ease:
            'power2.out',

        }
      );


      renderObject(
        object
      );


      drag =
        null;

    };

    artifactElements.forEach(
      (
        element,
        index
      ) => {

        element.addEventListener(
          'pointerdown',
          (event) => {

            const object =
              objects[index];


            if (!object) {
              return;
            }


            startDrag(
              event,
              object
            );

          }
        );

      }
    );

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      {
        passive: false,
      }
    );

    window.addEventListener(
      'pointerup',
      endDrag
    );


    window.addEventListener(
      'pointercancel',
      endDrag
    );

    const handlePointerLeave = () => {

      if (!drag) {
        mouse.active =
          false;
      }

    };

    field.addEventListener('pointerleave', handlePointerLeave);

    //if things collide
    const resolveCollisions = () => {

      const count =
        objects.length;


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const a =
          objects[i];


        for (
          let j = i + 1;
          j < count;
          j++
        ) {

          const b =
            objects[j];


          const aCenterX =
            a.x +
            a.width * 0.5;

          const aCenterY =
            a.y +
            a.height * 0.5;


          const bCenterX =
            b.x +
            b.width * 0.5;

          const bCenterY =
            b.y +
            b.height * 0.5;


          const dx =
            bCenterX -
            aCenterX;

          const dy =
            bCenterY -
            aCenterY;


          const radiusA =
            Math.max(
              a.width,
              a.height
            ) *
            CONFIG.collisionRadiusMultiplier;


          const radiusB =
            Math.max(
              b.width,
              b.height
            ) *
            CONFIG.collisionRadiusMultiplier;


          const minimumDistance =
            radiusA +
            radiusB;


          const distanceSquared =
            dx * dx +
            dy * dy;


          if (
            distanceSquared <= 0 ||
            distanceSquared >=
            minimumDistance *
            minimumDistance
          ) {

            continue;

          }


          const distance =
            Math.sqrt(
              distanceSquared
            );


          const nx =
            dx / distance;

          const ny =
            dy / distance;


          const overlap =
            minimumDistance -
            distance;


          /*
           * Position correction.
           */

          if (a.dragging) {

            b.x +=
              nx * overlap;

            b.y +=
              ny * overlap;

          } else if (
            b.dragging
          ) {

            a.x -=
              nx * overlap;

            a.y -=
              ny * overlap;

          } else {

            const totalMass =
              a.mass +
              b.mass;


            const aShare =
              b.mass /
              totalMass;

            const bShare =
              a.mass /
              totalMass;


            a.x -=
              nx *
              overlap *
              aShare;

            a.y -=
              ny *
              overlap *
              aShare;


            b.x +=
              nx *
              overlap *
              bShare;

            b.y +=
              ny *
              overlap *
              bShare;

          }


          /*
           * Impulse.
           */

          const relativeVelocityX =
            b.vx -
            a.vx;

          const relativeVelocityY =
            b.vy -
            a.vy;


          const velocityAlongNormal =
            relativeVelocityX * nx +
            relativeVelocityY * ny;


          if (
            velocityAlongNormal > 0
          ) {

            continue;

          }


          const impulse =
            -(
              1 +
              CONFIG.collisionBounce
            ) *
            velocityAlongNormal /
            (
              1 / a.mass +
              1 / b.mass
            );


          const impulseX =
            impulse * nx;

          const impulseY =
            impulse * ny;


          if (!a.dragging) {

            a.vx -=
              impulseX /
              a.mass;

            a.vy -=
              impulseY /
              a.mass;

          }


          if (!b.dragging) {

            b.vx +=
              impulseX /
              b.mass;

            b.vy +=
              impulseY /
              b.mass;

          }


          /*
           * Impact spin.
           */

          if (!a.dragging) {

            a.rotationVelocity -=
              relativeVelocityY *
              CONFIG.rotationStrength;

          }


          if (!b.dragging) {

            b.rotationVelocity +=
              relativeVelocityX *
              CONFIG.rotationStrength;

          }

        }

      }

    };

    const applyBoundaries = (object) => {

      if (object.x < 0) {

        object.x =
          0;


        if (object.vx < 0) {

          object.vx *=
            -CONFIG.sideBounce;

        }

      }


      /*
       * Right.
       */

      if (
        object.x +
        object.width >
        fieldWidth
      ) {

        object.x =
          Math.max(
            0,
            fieldWidth -
            object.width
          );


        if (object.vx > 0) {

          object.vx *=
            -CONFIG.sideBounce;

        }

      }

      if (
        object.y +
        object.height >
        fieldHeight
      ) {

        object.y =
          Math.max(
            0,
            fieldHeight -
            object.height
          );


        if (object.vy > 0) {

          object.vy *=
            CONFIG.floorBounce;

          object.vx *=
            0.88;

          object.rotationVelocity +=
            object.vx *
            CONFIG.rotationStrength;

        }


        if (
          Math.abs(
            object.vy
          ) < 0.8
        ) {

          object.vy =
            0;

        }

      }

    };


    const update = (now) => {

      if (!isVisible) {

        animationFrame =
          requestAnimationFrame(
            update
          );

        return;

      }


      const delta =
        Math.min(
          (
            now -
            lastTime
          ) / 1000,
          0.032
        );


      lastTime =
        now;


      if (delta <= 0) {

        animationFrame =
          requestAnimationFrame(
            update
          );

        return;

      }


      objects.forEach(
        (object) => {

          if (
            object.dragging
          ) {

            return;

          }


          /*
           * Gravity.
           */

          object.vy +=
            CONFIG.gravity *
            delta *
            60 *
            object.mass;

          applyMouseForce(object, delta);

          object.vx +=
            Math.sin(
              now * 0.0004 +
              object.x
            ) *
            CONFIG.drift *
            delta;

          const friction =
            Math.pow(
              CONFIG.airFriction,
              delta * 60
            );


          object.vx *=
            friction;

          object.vy *=
            friction;

          object.vx =
            clamp(
              object.vx,
              -CONFIG.maxVelocity,
              CONFIG.maxVelocity
            );

          object.vy =
            clamp(
              object.vy,
              -CONFIG.maxVelocity,
              CONFIG.maxVelocity
            );

          object.x +=
            object.vx *
            delta *
            60;

          object.y +=
            object.vy *
            delta *
            60;

          object.rotation +=
            object.rotationVelocity *
            delta *
            60;


          object.rotationVelocity *=
            Math.pow(
              CONFIG.rotationFriction,
              delta * 60
            );


          applyBoundaries(
            object
          );

        }
      );


      resolveCollisions();

      renderAll();


      animationFrame =
        requestAnimationFrame(
          update
        );

    };


    const handleResize = () => {

      measureField();


      objects.forEach(
        (object) => {

          object.x =
            clamp(
              object.x,
              0,
              Math.max(
                0,
                fieldWidth -
                object.width
              )
            );


          object.y =
            clamp(
              object.y,
              0,
              Math.max(
                0,
                fieldHeight -
                object.height
              )
            );

        }
      );


      renderAll();

    };


    const resizeObserver =
      new ResizeObserver(
        () => {

          clearTimeout(
            resizeTimer
          );


          resizeTimer =
            setTimeout(
              handleResize,
              50
            );

        }
      );


    resizeObserver.observe(
      field
    );

    const handleVisibilityChange = () => {

      isVisible =
        !document.hidden;


      if (isVisible) {

        lastTime =
          performance.now();

      }

    };


    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    const initialize = () => {

      createObjects();


      if (reducedMotion) {

        objects.forEach(
          (object) => {

            object.x =
              random(
                0,
                Math.max(
                  0,
                  fieldWidth -
                  object.width
                )
              );


            object.y =
              random(
                0,
                Math.max(
                  0,
                  fieldHeight -
                  object.height
                )
              );


            object.inner.style.transform =
              `scale(${object.scale})`;


            renderObject(
              object
            );

          }
        );


        return;

      }


      animateIn();


      lastTime =
        performance.now();


      animationFrame =
        requestAnimationFrame(
          update
        );

    };

    const imagePromises =
      artifactElements.map(
        (element) => {

          const image =
            element.querySelector(
              'img'
            );


          if (
            !image ||
            image.complete
          ) {

            return Promise.resolve();

          }


          return new Promise(
            (resolve) => {

              image.addEventListener(
                'load',
                resolve,
                {
                  once: true,
                }
              );


              image.addEventListener(
                'error',
                resolve,
                {
                  once: true,
                }
              );

            }
          );

        }
      );


    Promise.all(
      imagePromises
    ).then(
      () => {

        requestAnimationFrame(
          initialize
        );

      }
    );

    return () => {

      if (animationFrame) {

        cancelAnimationFrame(
          animationFrame
        );

      }


      resizeObserver.disconnect();


      clearTimeout(
        resizeTimer
      );


      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );


      window.removeEventListener(
        'pointerup',
        endDrag
      );


      window.removeEventListener(
        'pointercancel',
        endDrag
      );


      field.removeEventListener(
        'pointerleave',
        handlePointerLeave
      );


      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );


      artifactElements.forEach(
        (element) => {

          const inner =
            element.firstElementChild;


          if (inner) {

            gsap.killTweensOf(
              inner
            );

          }

        }
      );

    };

  }, [assets]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(".intro-logo", {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
      })
        .from(
          ".intro-date",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".intro-message",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "+=0.1"
        );
    }, introRef);

    return () => ctx.revert();
  }, []);


  return (

    <section className="relative h-screen min-h-[700px] overflow-hidden">

      <div ref={introRef} className="absolute inset-0 flex flex-col items-center justify-center">
        <Image src="/assets/svgs/g-solid.svg" alt="g logo" height={100} width={100} className='intro-logo' />
        <h1 className='intro-date mt-3 font-panchang font-bold uppercase text-4xl lg:text-6xl [color:var(--background)] [paint-order:stroke_fill] [-webkit-text-stroke:2px_white]'>May.29.2027</h1>
        <span className='intro-message font-mono text-[14px] italic'>also the 30th get something too lols</span>
      </div>

      <div className="absolute left-0 top-0 z-20 w-full p-6 sm:p-8 lg:p-12">

        <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-8">

          <div className="pointer-events-auto flex flex-row items-center justify-center gap-[10px]">
            <a href="https://dev-mililani-reunion.myshopify.com" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-[10px]">

              <Image src="/assets/svgs/globe.svg" alt="globe icon" height={25} width={25} />

              <div className="uppercase font-panchang text-[10px] cursor-pointer">
                MHS<br />
                '17
              </div>

              <div className="pointer-events-none absolute left-full top-1/2 ml-3 w-max max-w-[220px] -translate-y-1/2 translate-x-1 rounded-2xl bg-neutral-700 px-3 py-2 font-mono text-[9px] leading-relaxed text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                super secret password: tgod
              </div>

            </a>
          </div>

          <div className="text-right font-panchang text-[14px]">
            <a className='cursor-pointer hover:underline' href="https://www.instagram.com/the2017class/" target='_blank'>@the2017class</a>
          </div>

        </div>

      </div>


      <div ref={fieldRef} className="absolute inset-0 overflow-hidden [perspective:1000px] [touch-action:none] [overscroll-behavior:none]" />

      <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full p-6 sm:p-8 lg:p-12">

        <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-8">

          <div>
            {/* can put something hea */}
          </div>

          <div className="flex flex-row items-center justify-center gap-[10px] translate-y-[-6px]">

            <h2 className="font-instrument text-[30px] tracking-tighter translate-y-[3px]">
              MMXVII
            </h2>

            <Image src="/assets/svgs/griff.svg" alt="mini griffin logo" height={25} width={25} />

          </div>

        </div>

      </div>

    </section >

  );
}

function selectedAssetCountPlaceholder() {
  return null;
}