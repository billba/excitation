import './App.css'

// const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

interface Props {
  page: number,
  setPage: React.Dispatch<React.SetStateAction<number>>,
}

export default function Sidebar({ page, setPage }: Props) {
  // const [retry, setRetry] = useState(0);
  // const [textLayer, setTextLayer] = useState<HTMLDivElement | undefined>(undefined);

  // useEffect(() => {
  //   if (retry < 9) {
  //     console.log("retry", retry);
  //     setTimeout(() => {
  //       console.log("iframeRef.current", iframeRef.current);
  //       console.log("iframeRef.current?.contentDocument", iframeRef.current?.contentDocument);
  //       const tc = iframeRef.current?.contentDocument?.getElementsByClassName('textLayer');
  //       console.log("tc", tc);
  //       if (tc?.length) {
  //         const textLayer = tc[0] as HTMLDivElement;
  //         if (textLayer) {
  //           console.log("textLayer", textLayer.innerText);
  //           setTextLayer(textLayer);
  //           return;
  //         }
  //       }
  //       setRetry(r => r + 1);
  //     }, 1000);
  //   }
  // }, [retry]);

  return (
    <div id="sidebar">
      <button onClick={() => setPage(page - 1)}>Previous</button>
      &nbsp;
      Page {page}
      &nbsp;
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  )
}
