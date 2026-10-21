"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function VideoActions({ id, visibility, status }: { id: string; visibility: string; status: string }) {
 const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const router=useRouter();
 async function change(){setBusy(true);setError("");try{
  const res=await fetch(`/api/admin/videos/${id}/publish`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({visibility:visibility==="public"?"private":"public"})});
  const json=await res.json();if(!res.ok)throw new Error(json.error||"Update failed");router.refresh();
 }catch(e){setError(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}}
 return <span><button disabled={busy||status!=="ready"} onClick={change}>{busy?"Saving…":visibility==="public"?"Make private":"Publish publicly"}</button>{error&&<small role="alert">{error}</small>}</span>;
}
