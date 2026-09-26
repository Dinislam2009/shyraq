import {OfflineReviewApp} from "@/components/offline-review-app";
import {getServerI18n} from "@/lib/i18n-server";

export default async function OfflinePage(){
 const {t}=await getServerI18n();
 return <><h1 className="sr-only">{t("offlineReview")}</h1><OfflineReviewApp/></>;
}
