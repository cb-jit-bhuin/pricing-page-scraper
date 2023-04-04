import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SquigglyLines from "../components/SquigglyLines";
import StartGithub from "../components/StartGithub";
import Code from "../components/Code";
import CollectAPITokenModal from "../components/CollectAPITokenModal";
import useLocalStorage from "../utils/hooks/useLocalStorage";
import * as XLSX from "xlsx";

export const Home: NextPage = () => {
  const router = useRouter();
  const urlState = router.query.slug;
  const [pricing, setPricing] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [curArticle, setCurArticle] = useState<string>("");
  const [apiToken, setApiToken] = useLocalStorage<string>("api_token", "");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [SelectedFile, setSelectedFile] = useState<File>();

  // useEffect(() => {
  //   if (
  //     urlState &&
  //     router.isReady &&
  //     !curArticle &&
  //     typeof urlState !== "string" &&
  //     urlState.every((subslug: string) => typeof subslug === "string")
  //   ) {
  //     generateSummary((urlState as string[]).join("/"));
  //   }
  // }, [router.isReady, urlState]);

  const convertJSONtoSheet = (data: any) => {
    //Convert the JSON data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and add the worksheet to it
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    // Write the workbook to a file
    XLSX.writeFile(workbook, "chatGPT.xlsx");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await generateSummary()
      .then((data) => {
        //console.log("hello");
        // console.log(data);
        convertJSONtoSheet(data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const setPricingDetails = async (url: string) => {
    //url = "https://" + url + "/";
    //i: This one is to call the scrape thing passing the selected file
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, apiToken, fetchPricingDetails: true }),
    });

    setLoading(true);

    if (!response.ok) {
      toast.error("Sorry something went wrong");
      return;
    }

    const pricingDetails = response.body;
    if (!pricingDetails) {
      return;
    }
    const reader = pricingDetails.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let price = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      price = price + chunkValue;
      setPricing((prev) => prev + chunkValue);
    }
    setLoading(false);
    return price;
  };

  const setOrgAddr = async (url: string) => {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, apiToken, fetchPricingDetails: false }),
    });

    setLoading(true);

    if (!response.ok) {
      toast.error("Sorry something went wrong");
      return;
    }

    const orgAddr = response.body;
    if (!orgAddr) {
      return;
    }
    const reader = orgAddr.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let addr = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      addr = addr + chunkValue;
      setAddress((prev) => prev + chunkValue);
    }
    setLoading(false);
    return addr;
  };

  const getURL = () => {};

  const generateSummary = async () => {
    return new Promise((resolve, reject) => {
      if (!SelectedFile) {
        toast.error("File is mandatory");
        reject("File not uploaded");
      }

      if (!apiToken) {
        setShowModal(true);
        reject("Api token");
      }
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(SelectedFile as File);

      fileReader.onload = (e) => {
        const bufferArray = e.target?.result;

        const wb = XLSX.read(bufferArray, { type: "buffer" });

        const wsname = wb.SheetNames[0];

        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        const promises = data.map(async (obj: any) => {
          if (obj.hasOwnProperty("Pricing")) {
            try {
              const price = await setPricingDetails(obj.Pricing);
              obj.pricing_plan = price;
            } catch (error) {
              obj.pricing_plan = "NA";
            }
          } else {
            obj.pricing_plan = "NA";
          }
          return obj;
        });
        Promise.all(promises)
          .then((updatedData) => {
            resolve(updatedData);
          })
          .catch((error) => {
            reject(error);
          });
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col pt-8 sm:pt-12">
      <Head>
        <title>SaaS Pricing Page Scraper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className="mx-auto mt-10 flex max-w-5xl flex-1 flex-col items-center justify-center px-2 sm:mt-20">
        <StartGithub />
        <h1 className="max-w-5xl text-4xl font-bold sm:text-7xl">
          Scrape{" "}
          <span className="relative whitespace-nowrap text-[#3290EE]">
            <SquigglyLines />
            <span className="relative text-rose-500">SaaS Pricing</span>
          </span>{" "}
          with AI
        </h1>
        <p className="mt-10 text-center text-lg text-gray-500 sm:text-2xl">
          Copy and paste any product's{" "}
          <span className="text-rose-500">pricing link </span>
          below.
        </p>
        <form
          className="flex w-full flex-col justify-center sm:w-3/4"
          onSubmit={handleSubmit}
        >
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="mx-auto mt-10 w-full rounded-lg border border-gray-500 bg-black p-3 outline-1 outline-white sm:mt-7"
          />
          {!loading && (
            <button
              type="submit"
              className="z-10 mx-auto mt-7 w-3/4 rounded-2xl border-gray-500 bg-rose-500 p-3 text-lg font-medium transition hover:bg-rose-400 sm:mt-10 sm:w-1/3"
            >
              Scrape →
            </button>
          )}
        </form>
        {loading && (
          <button
            className="z-10 mx-auto mt-7 w-3/4 cursor-not-allowed rounded-2xl border-gray-500 bg-rose-500 p-3 text-lg font-medium transition hover:bg-rose-400 sm:mt-10 sm:w-1/3"
            disabled
          >
            <div className="flex items-center justify-center text-white">
              <Image
                src="/loading.svg"
                alt="Loading..."
                width={28}
                height={28}
              />
            </div>
          </button>
        )}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        {pricing && (
          <div className="mb-10 w-full px-4 sm:w-3/4">
            <h2 className="mx-auto mt-16 max-w-3xl border-t border-gray-600 pt-8 text-center text-3xl font-bold sm:text-5xl">
              Result
            </h2>
            <div className="mx-auto mt-6 max-w-3xl text-lg leading-7">
              <Code content={pricing} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <CollectAPITokenModal
        showModal={showModal}
        setShowModal={setShowModal}
        apiToken={apiToken}
        setApiToken={setApiToken}
      />
    </div>
  );
};

export default Home;
