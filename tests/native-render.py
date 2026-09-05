"""Optional Linux Mesa GLES renderer: replay the application's recorded GL calls.
This verifies real shader compilation, mesh submission and a rendered still, but
is not a browser/DOM test. Requires libEGL, libGLESv2, Python and Pillow.
Usage: npm run test:render
"""
import ctypes as C,json,sys,time
from pathlib import Path
started=time.perf_counter();root=Path(sys.argv[1]);E=C.CDLL('libEGL.so.1');G=C.CDLL('libGLESv2.so.2');I=C.c_int;U=C.c_uint;F=C.c_float;P=C.c_void_p

def setup(lib,name,rest,args):
 f=getattr(lib,name);f.restype=rest;f.argtypes=args;return f
setup(E,'eglGetPlatformDisplay',P,[U,P,P]);setup(E,'eglInitialize',U,[P,P,P]);setup(E,'eglBindAPI',U,[U]);setup(E,'eglChooseConfig',U,[P,P,P,I,P]);setup(E,'eglCreatePbufferSurface',P,[P,P,P]);setup(E,'eglCreateContext',P,[P,P,P,P]);setup(E,'eglMakeCurrent',U,[P,P,P,P])
d=E.eglGetPlatformDisplay(0x31DD,None,None);assert E.eglInitialize(d,None,None);assert E.eglBindAPI(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3025,24,0x3038);config=P();num=I();assert E.eglChooseConfig(d,attrs,C.byref(config),1,C.byref(num)) and num.value
frame=json.loads((root/'frame.json').read_text());w,h=frame['width'],frame['height'];pattrs=(I*5)(0x3057,w,0x3056,h,0x3038);surf=E.eglCreatePbufferSurface(d,config,pattrs);cattrs=(I*3)(0x3098,3,0x3038);ctx=E.eglCreateContext(d,config,None,cattrs);assert E.eglMakeCurrent(d,surf,surf,ctx)
setup(G,'glGetString',C.c_char_p,[U]);print('Renderer:',G.glGetString(0x1F01).decode(),flush=True)
protos={
'glCreateShader':(U,[U]),'glCreateProgram':(U,[]),'glShaderSource':(None,[U,I,P,P]),'glCompileShader':(None,[U]),'glAttachShader':(None,[U,U]),'glLinkProgram':(None,[U]),'glBindAttribLocation':(None,[U,U,C.c_char_p]),'glGetShaderiv':(None,[U,U,P]),'glGetProgramiv':(None,[U,U,P]),'glGetShaderInfoLog':(None,[U,I,P,P]),'glGetProgramInfoLog':(None,[U,I,P,P]),'glGetUniformLocation':(I,[U,C.c_char_p]),
'glBindBuffer':(None,[U,U]),'glBufferData':(None,[U,C.c_ssize_t,P,U]),'glBufferSubData':(None,[U,C.c_ssize_t,C.c_ssize_t,P]),'glBindVertexArray':(None,[U]),'glEnableVertexAttribArray':(None,[U]),'glVertexAttribPointer':(None,[U,I,U,U,I,P]),'glVertexAttribDivisor':(None,[U,U]),
'glBindTexture':(None,[U,U]),'glPixelStorei':(None,[U,I]),'glTexImage2D':(None,[U,I,I,I,I,I,U,U,P]),'glTexParameteri':(None,[U,U,I]),'glGenerateMipmap':(None,[U]),'glBindFramebuffer':(None,[U,U]),'glFramebufferTexture2D':(None,[U,U,U,U,I]),'glDrawBuffers':(None,[I,P]),'glReadBuffer':(None,[U]),'glViewport':(None,[I,I,I,I]),'glEnable':(None,[U]),'glDisable':(None,[U]),'glDepthMask':(None,[U]),'glDepthFunc':(None,[U]),'glClear':(None,[U]),'glClearColor':(None,[F,F,F,F]),'glUseProgram':(None,[U]),'glActiveTexture':(None,[U]),'glUniform1i':(None,[I,I]),'glUniform1f':(None,[I,F]),'glUniform2f':(None,[I,F,F]),'glUniform3f':(None,[I,F,F,F]),'glUniform3fv':(None,[I,I,P]),'glUniformMatrix4fv':(None,[I,I,U,P]),'glDrawElements':(None,[U,I,U,P]),'glDrawArrays':(None,[U,I,I]),'glDrawArraysInstanced':(None,[U,I,I,I]),'glBlendFunc':(None,[U,U]),'glReadPixels':(None,[I,I,I,I,U,U,P]),'glGetError':(U,[]),'glFinish':(None,[])
}
for name,(ret,args) in protos.items():setup(G,name,ret,args)
for name in ['Buffers','Textures','VertexArrays','Framebuffers']:setup(G,'glGen'+name,None,[I,P])
objs={};arrays={}
def data(a):
 if a is None:return None
 if a['array'] not in arrays:arrays[a['array']]=C.create_string_buffer((root/a['array']).read_bytes())
 return arrays[a['array']]
def val(a):
 if a is None:return 0
 if isinstance(a,dict):
  if 'uniform' in a:return G.glGetUniformLocation(objs[a['program']],a['uniform'].encode())
  if 'id' in a:return objs[a['id']]
 return a
commands=json.loads((root/'commands.json').read_text());programs=0
for index,cmd in enumerate(commands):
 name,*a=cmd;fn='gl'+name[0].upper()+name[1:]
 if name.startswith('create'):
  dest=a.pop(0)['id']
  if name=='createShader':objs[dest]=G.glCreateShader(*a)
  elif name=='createProgram':objs[dest]=G.glCreateProgram()
  else:
   plural={'createBuffer':'Buffers','createTexture':'Textures','createVertexArray':'VertexArrays','createFramebuffer':'Framebuffers'}[name];x=U();getattr(G,'glGen'+plural)(1,C.byref(x));objs[dest]=x.value
 elif name=='shaderSource':
  b=a[1].encode();src=C.c_char_p(b);G.glShaderSource(val(a[0]),1,C.byref(src),None)
 elif name=='compileShader':
  sh=val(a[0]);G.glCompileShader(sh);ok=I();G.glGetShaderiv(sh,0x8B81,C.byref(ok))
  if not ok.value:
   buf=C.create_string_buffer(8192);G.glGetShaderInfoLog(sh,8192,None,buf);raise RuntimeError(buf.value.decode())
 elif name=='linkProgram':
  p=val(a[0]);
  for i,n in enumerate(a[1]):G.glBindAttribLocation(p,i,n.encode())
  G.glLinkProgram(p);ok=I();G.glGetProgramiv(p,0x8B82,C.byref(ok));
  if not ok.value:
   buf=C.create_string_buffer(8192);G.glGetProgramInfoLog(p,8192,None,buf);raise RuntimeError(buf.value.decode())
  programs+=1
 elif name=='bufferData':
  b=data(a[1]);G.glBufferData(a[0],C.sizeof(b)-1,b,a[2])
 elif name=='bufferSubData':
  b=data(a[2]);off=a[3]*4 if len(a)>3 else 0;length=a[4]*4 if len(a)>4 else C.sizeof(b)-1;G.glBufferSubData(a[0],a[1],length,C.byref(b,off))
 elif name=='texImage2D':G.glTexImage2D(*a[:8],data(a[8]))
 elif name=='drawBuffers':G.glDrawBuffers(len(a[0]),(U*len(a[0]))(*a[0]))
 elif name=='uniformMatrix4fv':G.glUniformMatrix4fv(val(a[0]),a[2]['length']//16,a[1],data(a[2]))
 elif name=='uniform3fv':G.glUniform3fv(val(a[0]),a[1]['length']//3,data(a[1]))
 else:getattr(G,fn)(*[val(x) for x in a])
 error=G.glGetError()
 if error:raise RuntimeError(f'GL error {hex(error)} at {index}: {name} {str(a)[:200]}')
G.glFinish();pixels=(C.c_ubyte*(w*h*4))();G.glReadPixels(0,0,w,h,0x1908,0x1401,pixels)
assert G.glGetError()==0, 'Readback failed'
assert max(pixels)>100 and sum(pixels[0::4])/len(pixels[0::4])>10, 'Black or empty render'
from PIL import Image
im=Image.frombytes('RGBA',(w,h),bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM);im.save(root/'render.png')
print('PASS:',programs,'programs compiled/linked;',len(commands),'real GL commands; no GL errors.',flush=True)
print(root/'render.png')
(root/'report.json').write_text(json.dumps({'renderer':G.glGetString(0x1F01).decode(),'programsCompiled':programs,'commandsReplayed':len(commands),'glErrors':0,'width':w,'height':h,'elapsedSeconds':round(time.perf_counter()-started,3),'browserVerified':False},indent=2))
