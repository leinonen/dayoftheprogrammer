#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define PI 3.1415926535898
#define EPS 0.005


const int marchIterations = 128;
float FOV = .75;
float stepSize = 0.75; 
float clipNear = 0.0;
float clipFar = 20.0;

mat2 rot2( float angle ) {
  float c = cos( angle );
  float s = sin( angle );
  return mat2( c, s,-s, c);
}

float bump(vec3 p) {
  return .5 + .5 * sin(p.x*PI*2.) * cos(p.y*PI*2.) * sin(p.z*PI*2.);
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdCross(vec3 p, float size) {
  float d0 = sdBox(p, vec3(0.5,  size, size));
  float d1 = sdBox(p, vec3(size, 0.5,  size));
  float d2 = sdBox(p, vec3(size, size, 0.5)); 
  return min(min(d0, d1), d2);
}

float map(vec3 p) {
  vec3 p0 = p;
  p.xy *= rot2(p.z * PI * .2);
  p = mod(p, 1.0) - 0.5;
  float bu = 0.0; // bump(p*5.5) * .03;
  float sd1 = sdBox(p, vec3(max(.15, .25 * cos(p0.z *PI*.2))));
  float sd2 = sdSphere(p + bu, .25);
  // float sd2 = sdCross(p, 0.05);
  return mix(sd1, sd2, cos(p0.z * PI*.125));
}

void main( void ) {
  vec2 aspect = vec2(1.); // vec2(resolution.x/resolution.y, 1.0);
  vec2 uv = (2.0*gl_FragCoord.xy/resolution.xy - 1.0) * aspect;
	
  vec3 lookAt   = vec3(0.0, 0.0, -time);
  vec3 camPos   = lookAt + vec3(0.0, 0.0, lookAt.z - 2.5);
  vec3 lightPos = lookAt + vec3(0.0, 1.0, lookAt.z - 2.5);

  vec3 ro = camPos; 
  vec3 forward = normalize(lookAt + camPos);
  vec3 right = normalize(vec3(forward.z, 0., -forward.x ));
  vec3 up = normalize(cross(forward, right));
  vec3 rd = normalize(forward + FOV*uv.x*right + FOV*uv.y*up);

  rd.xy *= rot2( PI*sin(-time*0.5)/4.0 );
  rd.xz *= rot2( PI*sin(-time*0.5)/12.0  + PI * cos(time * PI * .03));

  float t = 0.0;
  for (int i = 0 ; i < marchIterations; i++) {
    float dist = map(ro + rd * t);
    if ((dist < clipNear) || (t > clipFar)) {
      break;
    }
    t += dist * stepSize;
  }
  vec3 p = ro + rd * t;
  
  vec3 lightColor = vec3(1.5);
  vec3 sceneColor = vec3(.42, .2, .6);
  vec3 objectColor = vec3(1.2, .4, .5);
  objectColor.rg *= rot2(p.z * PI * .3);
  objectColor.gb *= rot2(p.x * PI * .3);
  
  if (t > clipFar) {
    gl_FragColor = vec4(sceneColor, 1.0);
    return;
  }

  vec3 normal = normalize(vec3(
    map(vec3(p.x+EPS,p.y,p.z)) - map(vec3(p.x-EPS,p.y,p.z)),
    map(vec3(p.x,p.y+EPS,p.z)) - map(vec3(p.x,p.y-EPS,p.z)),
    map(vec3(p.x,p.y,p.z+EPS)) - map(vec3(p.x,p.y,p.z-EPS))
  ));

  vec3 lightDirection = lightPos - p;
  vec3 eyeDirection = camPos - p;

  float len = length(lightDirection);
  lightDirection /= len;
  float lightAtten = min(1.0 / ( 0.25*len*len ), 1.0 );

  float ambient = .1;
  float diffuse = max( 0.0, dot(normal, lightDirection) );
  float specularPower = 128.0;
  float specular = pow(max( 0.0, dot(reflect(-lightDirection, normal), normalize(eyeDirection)) ), specularPower);

  sceneColor += (objectColor*(diffuse*0.9+ambient)+specular*0.2)*lightColor*lightAtten;

  gl_FragColor = vec4(clamp(sceneColor, 0.0, 1.0), 1.0);
}
