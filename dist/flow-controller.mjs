/** A single clock for playback, manual selection, visibility and reduced motion. */
export function createWalkthrough({count=4,duration=3200,schedule=setTimeout,cancel=clearTimeout,onChange=()=>{},reduced=false}={}) {
  let state={step:0,playing:false,completed:false,reduced,visible:true};
  let timer=null,epoch=0,started=false,resumeOnVisible=false,destroyed=false;
  const emit=()=>onChange({...state});
  function clear(){epoch++;if(timer!==null){cancel(timer);timer=null;}}
  function arm(){
    clear();
    if(!state.playing||!state.visible||destroyed)return;
    const expected=epoch;
    timer=schedule(()=>{
      if(expected!==epoch||destroyed)return;
      timer=null;
      if(state.step===count-1){state.playing=false;state.completed=true;emit();return;}
      state.step++;emit();arm();
    },duration);
  }
  function play(){
    if(destroyed||state.reduced)return;
    started=true;
    if(state.completed){state.step=0;state.completed=false;}
    if(!state.visible){resumeOnVisible=true;emit();return;}
    state.playing=true;resumeOnVisible=false;emit();arm();
  }
  function pause(){clear();state.playing=false;resumeOnVisible=false;emit();}
  return {
    getState:()=>({...state}),
    play,
    pause,
    autoStart(){if(!started&&!state.reduced&&state.visible)play();},
    select(step){if(!Number.isInteger(step)||step<0||step>=count)throw new RangeError('Invalid walkthrough step');started=true;pause();state.step=step;state.completed=false;emit();},
    replay(){started=true;clear();resumeOnVisible=false;state.step=0;state.completed=false;state.playing=false;emit();play();},
    setReduced(value){state.reduced=!!value;if(state.reduced)pause();else emit();},
    setVisible(value){
      const visible=!!value;if(visible===state.visible)return;
      state.visible=visible;
      if(!visible){resumeOnVisible=state.playing;clear();state.playing=false;emit();}
      else if(resumeOnVisible){resumeOnVisible=false;play();}
      else emit();
    },
    destroy(){clear();destroyed=true;state.playing=false;resumeOnVisible=false;},
  };
}

export function normaliseWallet(value){
  const address=String(value).trim();
  return /^0x[a-fA-F0-9]{40}$/.test(address)?address.toLowerCase():null;
}
