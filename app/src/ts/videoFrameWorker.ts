
let crop: NonNullable<VideoFrameWorkerMessageData['crop']> = {
  xStart: 0,
  xEnd: 1,
};

let mostRecentUsableCrop: {x:number, width: number} = {x:0, width:100};

function transform(frame: VideoFrame, controller: TransformStreamDefaultController) {
  const x = Math.trunc(frame.displayWidth * crop.xStart);
  const width = Math.trunc(frame.displayWidth * (crop.xEnd - crop.xStart));
  if(crop.xStart === 0 && crop.xEnd === 1.0) {
    controller.enqueue(frame);
    return;
  }
  // Cropping from an existing video frame is supported by the API in Chrome 94+.
  try{
    const newFrame = new VideoFrame(frame, {
      visibleRect: {
        x,
        width,
        y: 0,
        height: frame.displayHeight,
      },
    });
    controller.enqueue(newFrame);
    mostRecentUsableCrop = {x, width};
    frame.close();
  } catch(e) {
    console.error(x, mostRecentUsableCrop, e);
    try {

      const newFrame = new VideoFrame(frame, {
        visibleRect: {
          x: mostRecentUsableCrop.x,
          width: Math.min(width, frame.displayWidth-mostRecentUsableCrop.x),
          y: 0,
          height: frame.displayHeight,
        },
      });
      controller.enqueue(newFrame);
      frame.close();
    }catch(e) {
      console.error('recovery transform failed also', e, mostRecentUsableCrop);
      controller.enqueue(frame);
      frame.close();
    }
  }
}
export type VideoFrameWorkerMessageData = {
  streams?: {
    readable: ReadableStream<VideoFrame>
    writable: WritableStream<VideoFrame>
  }
  crop?: {
    xStart: number,
    xEnd: number,
  }
  // pause?: boolean
}
// let streams: VideoFrameWorkerMessageData['streams'];
// const abortController = new AbortController();
self.onmessage = async (event: MessageEvent<VideoFrameWorkerMessageData>) => {

  console.log('worker received msg:', event.data);
  if(event.data.streams){
    const streams = event.data.streams;
    const {readable, writable} = streams;
    const transformer = new TransformStream({transform});
    readable
      .pipeThrough(transformer)
      .pipeTo(writable);
  }

  if(event.data.crop) {
    crop = event.data.crop;
  }
  // if(event.data.pause !== undefined){
  //   const pause = event.data.pause;
  //   if(pause){
  //     // abortController.abort('no more cropping, please');
  //     // streams?.readable.cancel();
  //     // streams?.writable.close();
  //   }
  // }

};

console.log('worker created');