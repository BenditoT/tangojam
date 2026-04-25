# Statische Website für Cloud Run — nginx auf Port 8080
#
# Geeignet für: Single-File HTML-Apps (Helferplan, KRS Connect, Klassenarbeitsplan),
# React-Builds, Vue-Builds, reine HTML/CSS/JS-Sites.
#
# Erwartet: alle zu servenden Dateien im Repo-Root oder in "./public" /  "./dist".
# Passe die COPY-Zeile unten ggf. an.

FROM nginx:1.27-alpine

# Nginx-Konfiguration so anpassen, dass sie auf Port 8080 lauscht (Cloud-Run-Default)
# und gzip/SPA-Fallback sauber macht.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Statische Dateien einspielen — PASSE DEN SOURCE-PFAD AN:
#   - reines HTML im Root:  COPY . /usr/share/nginx/html/
#   - Build-Output:          COPY dist/ /usr/share/nginx/html/
COPY . /usr/share/nginx/html/

# Cloud Run benötigt einen non-root-fähigen nginx — bei :alpine ist das offiziell unterstützt
# über die Variable PORT, aber nginx.conf hat das schon fest auf 8080.
EXPOSE 8080

# Default-Command vom nginx-Base-Image passt — nginx -g "daemon off;"
