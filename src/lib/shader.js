// most of the code comes from https://webglfundamentals.org

export function compile(gl, vertexShaderSource, fragmentShaderSource) {
  let vertexShader = getShader(gl, 'vertex', vertexShaderSource);
  let fragmentShader = getShader(gl, 'fragment', fragmentShaderSource);
  let program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error('shader initialization error')
  }
  return createProgramInfo(gl, program)
}

function getShader(gl, type, source) {
  let shader;
  if (type == 'fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (type == 'vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createProgramInfo(gl, program) {
  if (!program) {
    return null
  }
  let uniformSetters = createUniformSetters(gl, program)
  let attribSetters = createAttributeSetters(gl, program)
  return {
    program: program,
    uniformSetters: uniformSetters,
    attribSetters: attribSetters
  }
}

function createAttributeSetters(gl, program) {
  let attribSetters = {
  }

  function createAttribSetter(index) {
    return function (b) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer)
      gl.enableVertexAttribArray(index)
      gl.vertexAttribPointer(
        index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0)
    }
  }

  let numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
  for (let ii = 0; ii < numAttribs; ++ii) {
    let attribInfo = gl.getActiveAttrib(program, ii)
    if (!attribInfo) {
      break
    }
    let index = gl.getAttribLocation(program, attribInfo.name)
    attribSetters[attribInfo.name] = createAttribSetter(index)
  }

  return attribSetters
}

function getBindPointForSamplerType(gl, type) {
  if (type === gl.SAMPLER_2D) return gl.TEXTURE_2D;        // eslint-disable-line
  if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;  // eslint-disable-line
  return undefined
}

function createUniformSetters(gl, program) {
  let textureUnit = 0

  function createUniformSetter(program, uniformInfo) {
    let location = gl.getUniformLocation(program, uniformInfo.name)
    let type = uniformInfo.type
    // Check if this uniform is an array
    let isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]')
    if (type === gl.FLOAT && isArray) {
      return function (v) {
        gl.uniform1fv(location, v)
      }
    }
    if (type === gl.FLOAT) {
      return function (v) {
        gl.uniform1f(location, v)
      }
    }
    if (type === gl.FLOAT_VEC2) {
      return function (v) {
        gl.uniform2fv(location, v)
      }
    }
    if (type === gl.FLOAT_VEC3) {
      return function (v) {
        gl.uniform3fv(location, v)
      }
    }
    if (type === gl.FLOAT_VEC4) {
      return function (v) {
        gl.uniform4fv(location, v)
      }
    }
    if (type === gl.INT && isArray) {
      return function (v) {
        gl.uniform1iv(location, v)
      }
    }
    if (type === gl.INT) {
      return function (v) {
        gl.uniform1i(location, v)
      }
    }
    if (type === gl.INT_VEC2) {
      return function (v) {
        gl.uniform2iv(location, v)
      }
    }
    if (type === gl.INT_VEC3) {
      return function (v) {
        gl.uniform3iv(location, v)
      }
    }
    if (type === gl.INT_VEC4) {
      return function (v) {
        gl.uniform4iv(location, v)
      }
    }
    if (type === gl.BOOL) {
      return function (v) {
        gl.uniform1iv(location, v)
      }
    }
    if (type === gl.BOOL_VEC2) {
      return function (v) {
        gl.uniform2iv(location, v)
      }
    }
    if (type === gl.BOOL_VEC3) {
      return function (v) {
        gl.uniform3iv(location, v)
      }
    }
    if (type === gl.BOOL_VEC4) {
      return function (v) {
        gl.uniform4iv(location, v)
      }
    }
    if (type === gl.FLOAT_MAT2) {
      return function (v) {
        gl.uniformMatrix2fv(location, false, v)
      }
    }
    if (type === gl.FLOAT_MAT3) {
      return function (v) {
        gl.uniformMatrix3fv(location, false, v)
      }
    }
    if (type === gl.FLOAT_MAT4) {
      return function (v) {
        gl.uniformMatrix4fv(location, false, v)
      }
    }
    if ((type === gl.SAMPLER_2D) && isArray) {
      let units = []
      for (let ii = 0; ii < uniformInfo.size; ++ii) {
        units.push(textureUnit++)
      }
      return (function (bindPoint, units) {
        return function (textures) {
          gl.uniform1iv(location, units)
          textures.forEach(function (texture, index) {
            gl.activeTexture(gl.TEXTURE0 + units[index])
            gl.bindTexture(bindPoint, texture)
          })
        }
      }(getBindPointForSamplerType(gl, type), units))
    }
    if (type === gl.SAMPLER_2D) {
      return (function (bindPoint, unit) {
        return function (texture) {
          gl.uniform1i(location, unit)
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(bindPoint, texture)
        }
      }(getBindPointForSamplerType(gl, type), textureUnit++))
    }
    throw ('unknown type: 0x' + type.toString(16)) // eslint-disable-line
  }

  let uniformSetters = {}
  let numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)

  for (let ii = 0; ii < numUniforms; ++ii) {
    let uniformInfo = gl.getActiveUniform(program, ii)
    if (!uniformInfo) {
      break
    }
    let name = uniformInfo.name
    // remove the array suffix.
    if (name.substr(-3) === '[0]') {
      name = name.substr(0, name.length - 3)
    }
    let setter = createUniformSetter(program, uniformInfo)
    uniformSetters[name] = setter
  }
  return uniformSetters
}

function applySetters(setters, values) {
  Object.keys(values).forEach(function (name) {
    let setter = setters[name]
    if (setter) {
      setter(values[name])
    }
  })
}

function setAttributes(setters, attribs) {
  applySetters(setters.attribSetters || setters, attribs)
}

export const setUniforms = (setters, values) => {
  applySetters(setters.uniformSetters || setters, values)
}

export const setBuffersAndAttributes = (gl, setters, buffers) => {
  setAttributes(setters, buffers.attribs)
  if (buffers.indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
  }
}
