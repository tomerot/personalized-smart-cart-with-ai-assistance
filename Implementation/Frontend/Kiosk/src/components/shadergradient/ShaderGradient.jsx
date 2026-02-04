import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

function ShaderGradientBackground() {
  return (
    <ShaderGradientCanvas
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <ShaderGradient
        control="props"
        animate="on"
        brightness={1.6}
        cAzimuthAngle={180}
        cDistance={2.3}
        cPolarAngle={90}
        cameraZoom={1}
        color1="#ffffff"
        color2="#50c471"
        color3="#d5fad6"
        envPreset="city"
        grain="off"
        lightType="3d"
        positionX={-0.1}
        positionY={1}
        positionZ={0}
        reflection={0.1}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
        shader="defaults"
        type="waterPlane"
        uAmplitude={1}
        uDensity={1.3}
        uFrequency={5.5}
        uSpeed={0.4}
        uStrength={4}
        uTime={0}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}

export default ShaderGradientBackground;
