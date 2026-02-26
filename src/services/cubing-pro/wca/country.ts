import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import { Country } from '@/services/cubing-pro/wca/types';


export async function CountryList(): Promise<Country[]>{
  const response = await Request.get<Country[]>(
    `/wca/country`,
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}
