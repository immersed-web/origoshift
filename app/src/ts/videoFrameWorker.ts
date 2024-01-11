let crop: NonNullable<VideoFrameWorkerMessageData['crop']> = {
  xStart: 0,
  xEnd: 1,
};

let mostRecentUsableCrop: {x:number, width: number} = {x:0, width:100};

function transform(frame: VideoFrame, controller: TransformStreamDefaultController) {
  const x = Math.trunc(frame.displayWidth * crop.xStart);
  const width = Math.trunc(frame.displayWidth * (crop.xEnd - crop.xStart));
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
}
self.onmessage = async (event: MessageEvent<VideoFrameWorkerMessageData>) => {
  if(event.data.streams){
    const {readable, writable} = event.data.streams;
    readable
      .pipeThrough(new TransformStream({transform}))
      .pipeTo(writable);
  }
  if(event.data.crop) {
    crop = event.data.crop;
  }

};