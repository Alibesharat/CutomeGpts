"use client";

import React, { useEffect, useState } from "react";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ellipsisMiddle } from "@/lib/utils";
import { AuthBanner } from "./authBanner";
import { LockKeyhole } from "lucide-react";

// Schema definition (outside component)
const AuthFormSchema = z.object({
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
});

export function Auth() {
  const { pgState, dispatch, showAuthDialog, setShowAuthDialog } =
    usePlaygroundState();
  // Move useState inside component
  const [isBlinking, setIsBlinking] = useState(false);

  const onLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: "SET_API_KEY", payload: null });
    setShowAuthDialog(true);
  };

  return (
    <div>
      {pgState.openaiAPIKey && (
        <div className="text-xs flex gap-2 items-center">
          <span className="font-semibold text-neutral-700">
            Using OpenAI API Key
          </span>
          <div className="py-1 px-2 rounded-md bg-neutral-200 text-neutral-600">
            {ellipsisMiddle(pgState.openaiAPIKey, 4, 4)}
          </div>
          <a className="hover:underline cursor-pointer" onClick={onLogout}>
            Clear
          </a>
        </div>
      )}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthComplete={() => setShowAuthDialog(false)}
      />
    </div>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
  onAuthComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthComplete: () => void;
}) {
  const { pgState, dispatch } = usePlaygroundState();
  const [isBlinking, setIsBlinking] = useState(false);
  const [error404, setError404] = useState(false);

  useEffect(() => {
    if (error404) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [error404]);

  // 2. Update the useForm hook with correct type and defaultValue
  const form = useForm<z.infer<typeof AuthFormSchema>>({
    resolver: zodResolver(AuthFormSchema),
    defaultValues: {
      phoneNumber: "", // matches schema field name
    },
  });

  // Add this useEffect hook to watch for changes in pgState.openaiAPIKey
  useEffect(() => {
    form.setValue("phoneNumber", pgState.openaiAPIKey || "");
  }, [pgState.openaiAPIKey, form]);

  // 3. Update the onSubmit function parameter type
  async function onSubmit(values: z.infer<typeof AuthFormSchema>) {
    try {
      const response = await fetch(
        `http://localhost:5129/api/AppUser/GetAccessToken/${values.phoneNumber}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
          },
        }
      );
      if (response.status === 404) {
        setError404(true);
        return;
      }
      const apiKey = await response.text();
      dispatch({ type: "SET_API_KEY", payload: apiKey });
      onOpenChange(false);
      onAuthComplete();
    } catch (error) {
      console.error("Error fetching API key:", error);
      form.setError("phoneNumber", {
        type: "manual",
        message: "Failed to fetch API key. Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 rounded-lg overflow-hidden max-h-[90vh] flex flex-col"
        dir="rtl"
        isModal={true}
      >
        <div className="overflow-y-auto">
          <AuthBanner />
          <div className="px-6 pb-6 pt-4 overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 text-right"
                dir="rtl"
              >
                <DialogHeader className="gap-2 text-right">
                  <DialogTitle className="text-center">Reload GPT </DialogTitle>
                  <DialogDescription className="text-right">
                    ریلود جی پی تی ، زبان جدیدی روی مغز شما بارگذاری میکند
                  </DialogDescription>
                  <DialogDescription className="text-right">
                    اگر ثبت نام نکرده اید از اینجا ثبت نام کنید{" "}
                    <a
                      href="https://iranexpedia.ir/reloadgpt"
                      target="_blank"
                      className="underline text-oai-green"
                    >
                      ReloadGpt
                    </a>
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-black/10 h-[1px] w-full" />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <div className="flex flex-col gap-2">
                        <FormLabel className="font-semibold text-sm whitespace-nowrap text-right">
                          برای اتصال شماره موبایل خود را وارد کنید
                        </FormLabel>
                        <div className="flex gap-2 w-full" dir="ltr">
                          <Button type="submit">اتصال</Button>
                          <FormControl className="w-full">
                            <Input
                              className="w-full text-right"
                              placeholder="شماره موبایل (مثال: 09120674032)"
                              {...field}
                             
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage className="text-right" />
                    </FormItem>
                  )}
                />
                <DialogDescription className="text-xs py-2 flex justify-between items-center text-center">
                  <div className="flex items-center gap-2 flex-1 text-center">
                    <span
                      className={`font-semibold ${
                        isBlinking ? "animate-[blink_0.5s_ease-in-out_3]" : ""
                      } ${error404 ? "text-red-500" : ""}`}
                    >
                      {error404
                        ? "شما هنوز ثبت نام نکرده اید! لطفا ابتدا در سایت ثبت نام کنید"
                        : "تمام اطلاعات شما محفوظ میماند"}
                    </span>
                    <LockKeyhole className="h-3 w-3 flex-shrink-0" />
                  </div>
                </DialogDescription>
              </form>
            </Form>
          </div>
          <div className="h-[45vh] sm:h-0"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
