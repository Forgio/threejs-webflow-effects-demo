varying float vNoise;
varying vec2 vUv;
uniform sampler2D uImage;
uniform float uTime;
uniform float uHoverState;

void main()	{

    vec2 newUV = vUv;

    vec2 p = newUV;
    float x = uHoverState;
    x = smoothstep( 0.0, 1.0, ( x * 2.0 + p.y - 1.0 ) );
    vec4 f = mix(
        texture2D(uImage, ( p - 0.5 ) * ( 1.0 - x ) + 0.5), 
        texture2D(uImage, ( p - 0.5 ) * x + 0.5), 
        x);

   // vec4 oceanView = texture2D(uImage,newUV);
    // gl_FragColor = vec4(finalColor,1.);
 //  gl_FragColor = vec4(vUv,0.,1.);
 //    gl_FragColor = oceanView + 0.5*vec4(vNoise);
  //  gl_FragColor = vec4(vNoise,0.,0.,1.);
    gl_FragColor = f;
 //   gl_FragColor = oceanView;
    gl_FragColor.rgb += 0.05 * vec3(vNoise);
}