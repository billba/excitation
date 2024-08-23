import './App.css'

// const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

interface Props {
  page: number,
  setPage: React.Dispatch<React.SetStateAction<number>>,
  doc: Document | null,
}

export default function Sidebar({ doc, page, setPage }: Props) {
  console.log(doc);
  return (
    <div id="sidebar">
      <p>doc is { doc ? 'available' : 'unavailable'}</p>
      <button onClick={() => setPage(page - 1)}>Previous</button>
      &nbsp;
      Page {page}
      &nbsp;
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  )
}
